import { and, eq, inArray, ne, sum } from 'drizzle-orm';
import { type Character } from './character.repo';
import { db } from './mysql';
import { characterVersions, characters, eventPlayers, events, users } from './schema';

class EventPlayersRepo {
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
			.insert(eventPlayers)
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
			.delete(eventPlayers)
			.where(
				and(
					eq(eventPlayers.eventId, eventId),
					eq(eventPlayers.characterVersionId, characterVersionId)
				)
			);
	}

	public async getPlayers({
		eventId
	}: {
		eventId: number;
	}): Promise<EventPlayerCharacter[]> {
		const rows = await db
			.select({
				id: characters.id,
				name: characters.name,
				ownerId: users.id,
				ownerName: users.name,
				kind: characters.kind,
				characterVersionId: characterVersions.id
			})
			.from(eventPlayers)
			.innerJoin(characterVersions, eq(characterVersions.id, eventPlayers.characterVersionId))
			.innerJoin(characters, eq(characters.id, characterVersions.characterId))
			.innerJoin(users, eq(users.id, eventPlayers.userId))
			.where(eq(eventPlayers.eventId, eventId));

		return rows.map((row) => ({
			id: row.id,
			name: row.name ?? '',
			ownerId: row.ownerId,
			ownerName: row.ownerName ?? '',
			kind: row.kind,
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
			.from(eventPlayers)
			.innerJoin(characterVersions, eq(characterVersions.id, eventPlayers.characterVersionId))
			.innerJoin(events, and(eq(events.id, eventPlayers.eventId), eq(events.status, 'Done')))
			.where(
				and(
					eq(characterVersions.characterId, characterId),
					ne(eventPlayers.eventId, excludeEventId)
				)
			);
		return Number(row?.totalReward ?? 0);
	}

	public async deleteForCharacterVersion(characterVersionId: number): Promise<void> {
		await db
			.delete(eventPlayers)
			.where(eq(eventPlayers.characterVersionId, characterVersionId));
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
			.from(eventPlayers)
			.innerJoin(characterVersions, eq(characterVersions.id, eventPlayers.characterVersionId))
			.innerJoin(events, eq(events.id, eventPlayers.eventId))
			.where(inArray(characterVersions.characterId, characterIds));

		return rows.map((row) => ({ ...row, eventName: row.eventName ?? '' }));
	}

	public async getPlayerForUser({
		eventId,
		userId
	}: {
		eventId: number;
		userId: number;
	}): Promise<{ characterId: number; characterVersionId: number } | undefined> {
		const [row] = await db
			.select({
				characterId: characterVersions.characterId,
				characterVersionId: eventPlayers.characterVersionId
			})
			.from(eventPlayers)
			.innerJoin(characterVersions, eq(characterVersions.id, eventPlayers.characterVersionId))
			.where(and(eq(eventPlayers.eventId, eventId), eq(eventPlayers.userId, userId)));
		if (row?.characterVersionId == null) return undefined;
		return { characterId: row.characterId, characterVersionId: row.characterVersionId };
	}

	public async getPlayerForCharacter({
		eventId,
		characterId
	}: {
		eventId: number;
		characterId: number;
	}): Promise<EventPlayer | undefined> {
		const [row] = await db
			.select({
				eventId: eventPlayers.eventId,
				userId: eventPlayers.userId,
				characterVersion: eventPlayers.characterVersionId
			})
			.from(eventPlayers)
			.innerJoin(characterVersions, eq(characterVersions.id, eventPlayers.characterVersionId))
			.where(
				and(eq(eventPlayers.eventId, eventId), eq(characterVersions.characterId, characterId))
			);
		if (row?.characterVersion == null) return undefined;
		return { eventId: row.eventId, userId: row.userId, characterVersion: row.characterVersion };
	}
}

export const eventPlayersRepo = new EventPlayersRepo();

export type EventPlayerCharacter = Character & { characterVersionId: number };

export type EventPlayer = {
	eventId: number;
	userId: number;
	characterVersion: number;
};

export function isEventPlayer(player: unknown): player is EventPlayer {
	return (
		typeof player === 'object' &&
		player != null &&
		'eventId' in player &&
		typeof player.eventId === 'number' &&
		'userId' in player &&
		typeof player.userId === 'number' &&
		'characterVersion' in player &&
		typeof player.characterVersion === 'number'
	);
}
