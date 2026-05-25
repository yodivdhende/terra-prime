import { characterVersionRepo } from '$lib/db/character_version.repo';
import { isNumberOrError } from '$lib/request.utils';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
		const characterId = isNumberOrError(params.characterId);
		const versions = await characterVersionRepo.getForCharacter(characterId);
		return json(versions.map(({ id, name, characterId: cid }) => ({ id, name, characterId: cid })));
	});
};

export const PUT: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
		const characterId = isNumberOrError(params.characterId);
		const id = await characterVersionRepo.create({
			id: null,
			characterId,
			name: 'New Version',
			skills: [],
			items: [],
			implants: []
		});
		return json({ id });
	});
};
