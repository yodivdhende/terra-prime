import { characterVersionRepo } from '$lib/db/character_version.repo';
import { implantRepo } from '$lib/db/implants.repo';
import { itemRepo } from '$lib/db/items.repo';
import { skillRepo } from '$lib/db/skills.repo';
import { isNumberOrError } from '$lib/request.utils';
import { NotFoundRequest } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';
import type {
	CharacterVersionFull,
	VersionImplant,
	VersionItem,
	VersionSkill
} from '../../../../my/characters/versions/+server';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
		const versionId = isNumberOrError(params.versionId);
		const [bare, skills, items, implants] = await Promise.all([
			characterVersionRepo.getWithId(versionId),
			skillRepo.getAll(),
			itemRepo.getAll(),
			implantRepo.getAll()
		]);
		if (!bare) throw new NotFoundRequest();

		const skillById = new Map(skills.flatMap((s) => (s.id == null ? [] : [[s.id, s] as const])));
		const itemById = new Map(items.flatMap((i) => (i.id == null ? [] : [[i.id, i] as const])));
		const implantById = new Map(
			implants.flatMap((i) => (i.id == null ? [] : [[i.id, i] as const]))
		);

		const full: CharacterVersionFull = {
			id: bare.id,
			characterId: bare.characterId,
			name: bare.name,
			skills: bare.skills.flatMap((s): VersionSkill[] => {
				const skill = skillById.get(s.id);
				if (!skill) return [];
				return [{ id: s.id, name: skill.name, group: skill.groupId, groupName: skill.groupName, value: s.value }];
			}),
			items: bare.items.flatMap((i): VersionItem[] => {
				const item = itemById.get(i.id);
				if (!item) return [];
				return [{ id: i.id, name: item.name, description: item.description, count: i.count }];
			}),
			implants: bare.implants.flatMap((id): VersionImplant[] => {
				const implant = implantById.get(id);
				if (!implant) return [];
				return [{ id, name: implant.name, description: implant.description }];
			}),
			events: []
		};
		return json(full);
	});
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
		const versionId = isNumberOrError(params.versionId);
		const body: CharacterVersionFull = await request.json();
		await characterVersionRepo.update({
			id: versionId,
			characterId: body.characterId,
			name: body.name,
			skills: body.skills.map((s: VersionSkill) => ({ id: s.id, value: s.value })),
			items: body.items.map((i: VersionItem) => ({ id: i.id, count: i.count })),
			implants: body.implants.map((i: VersionImplant) => i.id)
		});
		return new Response(null, { status: 200 });
	});
};
