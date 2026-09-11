import { and, eq, inArray, ne, sum } from 'drizzle-orm';
import { type Character } from './character.repo';
import { db } from './mysql';
import { characterVersions, characters, eventParticipants, events, users } from './schema';

class EventParticipatnsRepo {
	public async participate({
		eventId,
		userId,
		characterVersionId
	}: {
		eventId: number;
		userId: number;
		characterVersionId: number;
	}) {
		await db
			.insert(eventParticipants)
			.values({ eventId, userId, characterVersionId })
			.onDuplicateKeyUpdate({ set: { characterVersionId } });
	}

	public async withdraw({
		eventId,
		characterVersionId
	}: {
		eventId: number;
		characterVersionId: number;
	}) {
		await db
			.delete(eventParticipants)
			.where(
				and(
					eq(eventParticipants.eventId, eventId),
					eq(eventParticipants.characterVersionId, characterVersionId)
				)
			);
	}

	public async getPerticipants({
		eventId
	}: {
		eventId: number;
	}): Promise<EventParticipantCharacter[]> {
		const rows = await db
			.select({
				id: characters.id,
				name: characters.name,
				ownerId: users.id,
				ownerName: users.name,
				characterVersionId: characterVersions.id
			})
			.from(eventParticipants)
			.innerJoin(characterVersions, eq(characterVersions.id, eventParticipants.characterVersionId))
			.innerJoin(characters, eq(characters.id, characterVersions.characterId))
			.innerJoin(users, eq(users.id, eventParticipants.userId))
			.where(eq(eventParticipants.eventId, eventId));

		return rows.map((row) => ({
			id: row.id,
			name: row.name ?? '',
			ownerId: row.ownerId,
			ownerName: row.ownerName ?? '',
			characterVersionId: row.characterVersionId
		}));
	}

	public async getSumPriorRewardBudget({
		characterId,
		excludeEventId
	}: {
		characterId: number;
		excludeEventId: number;
	}): Promise<number> {
		const [row] = await db
			.select({ totalReward: sum(events.rewardBudget) })
			.from(eventParticipants)
			.innerJoin(characterVersions, eq(characterVersions.id, eventParticipants.characterVersionId))
			.innerJoin(events, and(eq(events.id, eventParticipants.eventId), eq(events.status, 'Done')))
			.where(
				and(
					eq(characterVersions.characterId, characterId),
					ne(eventParticipants.eventId, excludeEventId)
				)
			);
		return Number(row?.totalReward ?? 0);
	}

	public async deleteForCharacterVersion(characterVersionId: number): Promise<void> {
		await db
			.delete(eventParticipants)
			.where(eq(eventParticipants.characterVersionId, characterVersionId));
	}

	public async getEventsForCharacters(
		characterIds: number[]
	): Promise<
		{ characterId: number; characterVersionId: number; eventId: number; eventName: string }[]
	> {
		if (characterIds.length === 0) return [];
		const rows = await db
			.select({
				characterId: characterVersions.characterId,
				characterVersionId: characterVersions.id,
				eventId: events.id,
				eventName: events.name
			})
			.from(eventParticipants)
			.innerJoin(characterVersions, eq(characterVersions.id, eventParticipants.characterVersionId))
			.innerJoin(events, eq(events.id, eventParticipants.eventId))
			.where(inArray(characterVersions.characterId, characterIds));

		return rows.map((row) => ({ ...row, eventName: row.eventName ?? '' }));
	}

	public async getUserParticipation({
		eventId,
		userId
	}: {
		eventId: number;
		userId: number;
	}): Promise<{ characterId: number; characterVersionId: number } | undefined> {
		const [row] = await db
			.select({
				characterId: characterVersions.characterId,
				characterVersionId: eventParticipants.characterVersionId
			})
			.from(eventParticipants)
			.innerJoin(characterVersions, eq(characterVersions.id, eventParticipants.characterVersionId))
			.where(and(eq(eventParticipants.eventId, eventId), eq(eventParticipants.userId, userId)));
		if (row?.characterVersionId == null) return undefined;
		return { characterId: row.characterId, characterVersionId: row.characterVersionId };
	}

	public async getParticipantForCharacter({
		eventId,
		characterId
	}: {
		eventId: number;
		characterId: number;
	}): Promise<EventParticapant | undefined> {
		const [row] = await db
			.select({
				eventId: eventParticipants.eventId,
				userId: eventParticipants.userId,
				characterVersion: eventParticipants.characterVersionId
			})
			.from(eventParticipants)
			.innerJoin(characterVersions, eq(characterVersions.id, eventParticipants.characterVersionId))
			.where(
				and(eq(eventParticipants.eventId, eventId), eq(characterVersions.characterId, characterId))
			);
		if (row?.characterVersion == null) return undefined;
		return { eventId: row.eventId, userId: row.userId, characterVersion: row.characterVersion };
	}
}

export const eventParticipantsRepo = new EventParticipatnsRepo();

export type EventParticipantCharacter = Character & { characterVersionId: number };

export type EventParticapant = {
	eventId: number;
	userId: number;
	characterVersion: number;
};

export function isEventParticapant(particiapant: unknown): particiapant is EventParticapant {
	return (
		typeof particiapant === 'object' &&
		particiapant != null &&
		'eventId' in particiapant &&
		typeof particiapant.eventId === 'number' &&
		'userId' in particiapant &&
		typeof particiapant.userId === 'number' &&
		'characterVersion' in particiapant &&
		typeof particiapant.characterVersion === 'number'
	);
}
