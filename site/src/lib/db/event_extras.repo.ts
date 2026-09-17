import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from './mysql';
import { characterVersions, characters, eventExtras, events, users } from './schema';

/**
 * Crew / NPC actors at an event. Where `Event_Players` holds the one version a player built,
 * an extra is handed characters by the organisation and may hold several over one event — so
 * rows accumulate per (Event, User) and the version is null until an admin assigns one.
 */
class EventExtrasRepo {
	/** Sign the user up as an extra. Idempotent: a second call for an enrolled user is a no-op. */
	public async enrol({ eventId, userId }: { eventId: number; userId: number }): Promise<void> {
		// The unique index permits repeated NULLs, so it cannot guard this pair for us.
		const existing = await this.getEnrolment({ eventId, userId });
		if (existing != null) return;
		await db.insert(eventExtras).values({ eventId, userId, characterVersionId: null });
	}

	/**
	 * Hand an NPC version to an extra. The empty row an enrolment leaves behind is filled first;
	 * after that every assignment adds a row, so an extra accumulates characters.
	 */
	public async assign({
		eventId,
		userId,
		characterVersionId
	}: {
		eventId: number;
		userId: number;
		characterVersionId: number;
	}): Promise<void> {
		const [empty] = await db
			.select({ id: eventExtras.id })
			.from(eventExtras)
			.where(
				and(
					eq(eventExtras.eventId, eventId),
					eq(eventExtras.userId, userId),
					isNull(eventExtras.characterVersionId)
				)
			);
		if (empty != null) {
			await db
				.update(eventExtras)
				.set({ characterVersionId })
				.where(eq(eventExtras.id, empty.id));
			return;
		}
		await db.insert(eventExtras).values({ eventId, userId, characterVersionId });
	}

	/**
	 * Take one character back off an extra. The assignment and the enrolment share a row, so when
	 * this is the only row that extra has at the event the version is nulled rather than deleted —
	 * unassigning a character must not quietly drop the person from the event. `withdraw` is the
	 * one way out.
	 */
	public async unassign({
		eventId,
		characterVersionId
	}: {
		eventId: number;
		characterVersionId: number;
	}): Promise<void> {
		const [row] = await db
			.select({ id: eventExtras.id, userId: eventExtras.userId })
			.from(eventExtras)
			.where(
				and(
					eq(eventExtras.eventId, eventId),
					eq(eventExtras.characterVersionId, characterVersionId)
				)
			);
		if (row == null) return;

		const rows = await db
			.select({ id: eventExtras.id })
			.from(eventExtras)
			.where(and(eq(eventExtras.eventId, eventId), eq(eventExtras.userId, row.userId)));

		if (rows.length === 1) {
			await db
				.update(eventExtras)
				.set({ characterVersionId: null })
				.where(eq(eventExtras.id, row.id));
			return;
		}
		await db.delete(eventExtras).where(eq(eventExtras.id, row.id));
	}

	/** Remove the extra from the event, assignments and all. */
	public async withdraw({ eventId, userId }: { eventId: number; userId: number }): Promise<void> {
		await db
			.delete(eventExtras)
			.where(and(eq(eventExtras.eventId, eventId), eq(eventExtras.userId, userId)));
	}

	public async getEnrolment({
		eventId,
		userId
	}: {
		eventId: number;
		userId: number;
	}): Promise<{ eventId: number; userId: number } | undefined> {
		const [row] = await db
			.select({ eventId: eventExtras.eventId, userId: eventExtras.userId })
			.from(eventExtras)
			.where(and(eq(eventExtras.eventId, eventId), eq(eventExtras.userId, userId)));
		return row;
	}

	/**
	 * The admin view. The joins to the character are `left` on purpose: an extra with nothing
	 * assigned yet still has to show up in the manage page's table.
	 */
	public async getForEvent({ eventId }: { eventId: number }): Promise<EventExtra[]> {
		const rows = await db
			.select({
				id: eventExtras.id,
				userId: users.id,
				userName: users.name,
				characterVersionId: eventExtras.characterVersionId,
				characterVersionName: characterVersions.name,
				characterId: characters.id,
				characterName: characters.name
			})
			.from(eventExtras)
			.innerJoin(users, eq(users.id, eventExtras.userId))
			.leftJoin(characterVersions, eq(characterVersions.id, eventExtras.characterVersionId))
			.leftJoin(characters, eq(characters.id, characterVersions.characterId))
			.where(eq(eventExtras.eventId, eventId));

		return rows.map((row) => ({
			id: row.id,
			userId: row.userId,
			userName: row.userName ?? '',
			characterVersionId: row.characterVersionId,
			characterVersionName: row.characterVersionName ?? null,
			characterId: row.characterId ?? null,
			characterName: row.characterName ?? null
		}));
	}

	/** The codex view: every NPC version this user has been handed, with the event it belongs to. */
	public async getForUser(userId: number): Promise<AssignedExtraCharacter[]> {
		const rows = await db
			.select({
				characterVersionId: eventExtras.characterVersionId,
				characterId: characterVersions.characterId,
				characterName: characters.name,
				eventId: events.id,
				eventName: events.name
			})
			.from(eventExtras)
			.innerJoin(characterVersions, eq(characterVersions.id, eventExtras.characterVersionId))
			.innerJoin(characters, eq(characters.id, characterVersions.characterId))
			.innerJoin(events, eq(events.id, eventExtras.eventId))
			.where(eq(eventExtras.userId, userId));

		return rows.flatMap((row) =>
			row.characterVersionId == null
				? []
				: [
						{
							characterVersionId: row.characterVersionId,
							characterId: row.characterId,
							characterName: row.characterName ?? '',
							eventId: row.eventId,
							eventName: row.eventName ?? ''
						}
					]
		);
	}

	/** Is this character at this event as an extra? Mirrors `getPlayerForCharacter`. */
	public async getExtraForCharacter({
		eventId,
		characterId
	}: {
		eventId: number;
		characterId: number;
	}): Promise<EventExtraAttendance | undefined> {
		const [row] = await db
			.select({
				eventId: eventExtras.eventId,
				userId: eventExtras.userId,
				characterVersion: eventExtras.characterVersionId
			})
			.from(eventExtras)
			.innerJoin(characterVersions, eq(characterVersions.id, eventExtras.characterVersionId))
			.where(and(eq(eventExtras.eventId, eventId), eq(characterVersions.characterId, characterId)));
		if (row?.characterVersion == null) return undefined;
		return { eventId: row.eventId, userId: row.userId, characterVersion: row.characterVersion };
	}

	public async deleteForCharacterVersion(characterVersionId: number): Promise<void> {
		await db.delete(eventExtras).where(eq(eventExtras.characterVersionId, characterVersionId));
	}

	public async deleteForCharacterVersions(characterVersionIds: number[]): Promise<void> {
		if (characterVersionIds.length === 0) return;
		await db
			.delete(eventExtras)
			.where(inArray(eventExtras.characterVersionId, characterVersionIds));
	}
}

export const eventExtrasRepo = new EventExtrasRepo();

/** One row of the admin table: an enrolment, plus the version handed out on it if there is one. */
export type EventExtra = {
	id: number;
	userId: number;
	userName: string;
	characterVersionId: number | null;
	characterVersionName: string | null;
	characterId: number | null;
	characterName: string | null;
};

export type AssignedExtraCharacter = {
	characterVersionId: number;
	characterId: number;
	characterName: string;
	eventId: number;
	eventName: string;
};

export type EventExtraAttendance = {
	eventId: number;
	userId: number;
	characterVersion: number;
};
