import { characterRepo, type Character } from "$lib/db/character.repo";
import { characterVersionRepo, type CharacterVersionBare } from "$lib/db/character_version.repo";
import { implantRepo, type Implant } from "$lib/db/implants.repo";
import { itemRepo, type Item } from "$lib/db/items.repo";
import { skillRepo, type Skill } from "$lib/db/skills.repo";
import { UserRole } from "$lib/types/roles";
import { getSessionToken } from "$lib/utils/cookies";
import { authGuardForUser, handleRequest } from "$lib/utils/request";
import { json, type RequestHandler } from "@sveltejs/kit";

export type VersionSkill = {
	id: number;
	name: string;
	group: number;
	groupName: string;
	value: number;
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
};

export type CharacterVersionFull = Omit<CharacterVersionBare, 'skills' | 'items' | 'implants'> & {
	skills: VersionSkill[];
	items: VersionItem[];
	implants: VersionImplant[];
};

export type CharacterWithVersions = Character & { versions: CharacterVersionFull[] };

export type MyCharacterVersionsResponse = {
	characters: CharacterWithVersions[];
};

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), [UserRole.user]);
		const [characters, versions, skills, items, implants] = await Promise.all([
			characterRepo.getByOwner(userId),
			characterVersionRepo.getForUser(userId),
			skillRepo.getAll(),
			itemRepo.getAll(),
			implantRepo.getAll()
		]);
		const response: MyCharacterVersionsResponse = {
			characters: toCharactersWithVersions(characters, versions, skills, items, implants)
		};
		return json(response);
	});
};

function toCharactersWithVersions(
	characters: Character[],
	versions: CharacterVersionBare[],
	skills: Skill[],
	items: Item[],
	implants: Implant[]
): CharacterWithVersions[] {
	const skillById = new Map(skills.flatMap((s) => (s.id == null ? [] : [[s.id, s] as const])));
	const itemById = new Map(items.flatMap((i) => (i.id == null ? [] : [[i.id, i] as const])));
	const implantById = new Map(
		implants.flatMap((i) => (i.id == null ? [] : [[i.id, i] as const]))
	);
	return characters.map((character) => ({
		...character,
		versions: versions
			.filter((version) => version.characterId === character.id)
			.map((version) => toFullVersion(version, skillById, itemById, implantById))
	}));
}

function toFullVersion(
	version: CharacterVersionBare,
	skillById: Map<number, Skill>,
	itemById: Map<number, Item>,
	implantById: Map<number, Implant>
): CharacterVersionFull {
	return {
		id: version.id,
		characterId: version.characterId,
		name: version.name,
		skills: version.skills.flatMap((s) => {
			const skill = skillById.get(s.id);
			if (!skill) return [];
			return [
				{
					id: s.id,
					name: skill.name,
					group: skill.groupId,
					groupName: skill.groupName,
					value: s.value
				}
			];
		}),
		items: version.items.flatMap((i) => {
			const item = itemById.get(i.id);
			if (!item) return [];
			return [{ id: i.id, name: item.name, description: item.description, count: i.count }];
		}),
		implants: version.implants.flatMap((id) => {
			const implant = implantById.get(id);
			if (!implant) return [];
			return [{ id, name: implant.name, description: implant.description }];
		})
	};
}
