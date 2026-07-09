import { characterRepo, type Character } from "$lib/db/character.repo";
import { characterVersionRepo, type CharacterVersionBare } from "$lib/db/character_version.repo";
import { companyRepo, type Company } from "$lib/db/companies.repo";
import { eventParticipantsRepo } from "$lib/db/event_participants.repo";
import { implantRepo, type Implant } from "$lib/db/implants.repo";
import { itemRepo, type Item } from "$lib/db/items.repo";
import { expertiseRepo, type Expertise } from "$lib/db/expertise.repo";
import { UserRole } from "$lib/types/roles";
import { getSessionToken } from "$lib/utils/cookies";
import { authGuardForUser, handleRequest } from "$lib/utils/request";
import { json, type RequestHandler } from "@sveltejs/kit";

export type VersionExpertise = {
	id: number;
	name: string;
	group: number;
	groupName: string;
	value: number;
	icon: string | null;
	groupIcon: string | null;
	groupColor: string | null;
};

export type VersionItem = {
	id: number;
	name: string;
	description: string;
	count: number;
};

export type VersionImplant = {
	id: number;
	name: string;
	description: string;
	slot: number;
};

export type VersionEvent = {
	id: number;
	name: string;
};

export type CharacterVersionFull = Omit<CharacterVersionBare, 'expertise' | 'items' | 'implants' | 'company'> & {
	expertise: VersionExpertise[];
	items: VersionItem[];
	implants: VersionImplant[];
	events: VersionEvent[];
	company: Company | null;
};

export type CharacterWithVersions = Character & { versions: CharacterVersionFull[] };

export type MyCharacterVersionsResponse = {
	characters: CharacterWithVersions[];
};

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), [UserRole.user]);
		const [characters, versions, expertise, items, implants, companies] = await Promise.all([
			characterRepo.getByOwner(userId),
			characterVersionRepo.getForUser(userId),
			expertiseRepo.getAll(),
			itemRepo.getAll(),
			implantRepo.getAll(),
			companyRepo.getAll()
		]);
		const events = await eventParticipantsRepo.getEventsForCharacters(characters.map((c) => c.id));
		const response: MyCharacterVersionsResponse = {
			characters: toCharactersWithVersions(characters, versions, expertise, items, implants, events, companies)
		};
		return json(response);
	});
};

function toCharactersWithVersions(
	characters: Character[],
	versions: CharacterVersionBare[],
	expertise: Expertise[],
	items: Item[],
	implants: Implant[],
	events: { characterVersionId: number; eventId: number; eventName: string }[],
	companies: Company[]
): CharacterWithVersions[] {
	const expertiseById = new Map(expertise.flatMap((e) => (e.id == null ? [] : [[e.id, e] as const])));
	const itemById = new Map(items.flatMap((i) => (i.id == null ? [] : [[i.id, i] as const])));
	const implantById = new Map(
		implants.flatMap((i) => (i.id == null ? [] : [[i.id, i] as const]))
	);
	const companyById = new Map(companies.flatMap((c) => (c.id == null ? [] : [[c.id, c] as const])));
	const eventsByVersionId = new Map<number, VersionEvent[]>();
	for (const e of events) {
		const list = eventsByVersionId.get(e.characterVersionId) ?? [];
		list.push({ id: e.eventId, name: e.eventName });
		eventsByVersionId.set(e.characterVersionId, list);
	}
	return characters.map((character) => ({
		...character,
		versions: versions
			.filter((version) => version.characterId === character.id)
			.map((version) => toFullVersion(version, expertiseById, itemById, implantById, eventsByVersionId, companyById))
	}));
}

function toFullVersion(
	version: CharacterVersionBare,
	expertiseById: Map<number, Expertise>,
	itemById: Map<number, Item>,
	implantById: Map<number, Implant>,
	eventsByVersionId: Map<number, VersionEvent[]>,
	companyById: Map<number, Company>
): CharacterVersionFull {
	return {
		id: version.id,
		characterId: version.characterId,
		name: version.name,
		company: version.company != null ? (companyById.get(version.company) ?? null) : null,
		expertise: version.expertise.flatMap((e) => {
			const expertise = expertiseById.get(e.id);
			if (!expertise) return [];
			return [
				{
					id: e.id,
					name: expertise.name,
					group: expertise.groupId,
					groupName: expertise.groupName,
					value: e.value,
					icon: expertise.icon ?? null,
					groupIcon: expertise.groupIcon ?? null,
					groupColor: expertise.groupColor ?? null
				}
			];
		}),
		items: version.items.flatMap((i) => {
			const item = itemById.get(i.id);
			if (!item) return [];
			return [{ id: i.id, name: item.name, description: item.description, count: i.count }];
		}),
		implants: version.implants.flatMap((vi) => {
			const implant = implantById.get(vi.id);
			if (!implant) return [];
			return [{ id: vi.id, name: implant.name, description: implant.description, slot: vi.slot }];
		}),
		events: version.id != null ? (eventsByVersionId.get(version.id) ?? []) : []
	};
}
