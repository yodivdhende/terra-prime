import { desc, eq, inArray } from 'drizzle-orm';
import { subcoRepo } from '$lib/db/subco.repo';
import { characterRepo } from '$lib/db/character.repo';
import { characterVersionRepo } from '$lib/db/character_version.repo';
import { expertiseRepo } from '$lib/db/expertise.repo';
import { itemRepo } from '$lib/db/items.repo';
import { implantRepo } from '$lib/db/implants.repo';
import { db } from '$lib/db/mysql';
import { characterVersions, eventParticipants, events } from '$lib/db/schema';
import { isNumberOrError } from '$lib/request.utils';
import { NotFoundRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export type SubcoMemberVersionExpertise = {
	id: number;
	name: string;
	group: number;
	groupName: string;
	value: number;
	icon: string | null;
	groupIcon: string | null;
	groupColor: string | null;
};

export type SubcoMemberVersionItem = {
	id: number;
	name: string;
	description: string;
	count: number;
};

export type SubcoMemberVersionImplant = {
	id: number;
	name: string;
	description: string;
	slot: number;
};

export type SubcoMemberEntry = {
	characterId: number;
	characterName: string;
	ownerName: string;
	lastVersion: {
		id: number;
		name: string;
		expertise: SubcoMemberVersionExpertise[];
		items: SubcoMemberVersionItem[];
		implants: SubcoMemberVersionImplant[];
		event: { id: number; name: string } | null;
	} | null;
};

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const id = isNumberOrError(params.id);
		const subco = await subcoRepo.getWithId(id);
		if (subco == null) throw new NotFoundRequest();
		if (subco.members.length === 0) return json([]);

		const characters = await Promise.all(subco.members.map((cid) => characterRepo.getById(cid)));

		// Get the latest version per character, preferring the one used in the most recent event
		const rows = await db
			.select({
				characterId: characterVersions.characterId,
				versionId: characterVersions.id,
				eventId: events.id,
				eventName: events.name,
				startTime: events.startTime
			})
			.from(characterVersions)
			.leftJoin(eventParticipants, eq(eventParticipants.characterVersionId, characterVersions.id))
			.leftJoin(events, eq(events.id, eventParticipants.eventId))
			.where(inArray(characterVersions.characterId, subco.members))
			.orderBy(characterVersions.characterId, desc(events.startTime), desc(characterVersions.id));

		// First row per character is the latest (due to ORDER BY)
		const latestPerCharacter = new Map<
			number,
			{ versionId: number; eventId: number | null; eventName: string | null }
		>();
		for (const row of rows) {
			if (!latestPerCharacter.has(row.characterId)) {
				latestPerCharacter.set(row.characterId, {
					versionId: row.versionId,
					eventId: row.eventId ?? null,
					eventName: row.eventName ?? null
				});
			}
		}

		const versionIds = Array.from(latestPerCharacter.values()).map((v) => v.versionId);
		const [versions, expertise, items, implants] = await Promise.all([
			versionIds.length > 0 ? characterVersionRepo.getWithdIds(versionIds) : Promise.resolve([]),
			expertiseRepo.getAll(),
			itemRepo.getAll(),
			implantRepo.getAll()
		]);

		const expertiseById = new Map(
			expertise.flatMap((e) => (e.id == null ? [] : [[e.id, e] as const]))
		);
		const itemById = new Map(items.flatMap((i) => (i.id == null ? [] : [[i.id, i] as const])));
		const implantById = new Map(
			implants.flatMap((i) => (i.id == null ? [] : [[i.id, i] as const]))
		);

		const result: SubcoMemberEntry[] = characters.map((character) => {
			const latest = latestPerCharacter.get(character.id);
			if (!latest) {
				return {
					characterId: character.id,
					characterName: character.name,
					ownerName: character.ownerName,
					lastVersion: null
				};
			}

			const version = versions.find((v) => v.id === latest.versionId);
			if (!version) {
				return {
					characterId: character.id,
					characterName: character.name,
					ownerName: character.ownerName,
					lastVersion: null
				};
			}

			return {
				characterId: character.id,
				characterName: character.name,
				ownerName: character.ownerName,
				lastVersion: {
					id: version.id!,
					name: version.name,
					expertise: version.expertise.flatMap((e): SubcoMemberVersionExpertise[] => {
						const exp = expertiseById.get(e.id);
						if (!exp) return [];
						return [
							{
								id: e.id,
								name: exp.name,
								group: exp.groupId,
								groupName: exp.groupName,
								value: e.value,
								icon: exp.icon ?? null,
								groupIcon: exp.groupIcon ?? null,
								groupColor: exp.groupColor ?? null
							}
						];
					}),
					items: version.items.flatMap((i): SubcoMemberVersionItem[] => {
						const item = itemById.get(i.id);
						if (!item) return [];
						return [{ id: i.id, name: item.name, description: item.description, count: i.count }];
					}),
					implants: version.implants.flatMap((vi): SubcoMemberVersionImplant[] => {
						const implant = implantById.get(vi.id);
						if (!implant) return [];
						return [
							{ id: vi.id, name: implant.name, description: implant.description, slot: vi.slot }
						];
					}),
					event:
						latest.eventId != null && latest.eventName != null
							? { id: latest.eventId, name: latest.eventName }
							: null
				}
			};
		});

		return json(result);
	});
};
