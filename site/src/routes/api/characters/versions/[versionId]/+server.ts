import { characterVersionRepo, isCharacterVersionBare } from '$lib/db/character_version.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
		const versionId = isNumberOrError(params.versionId);
		const characterVersion = await characterVersionRepo.getWithId(versionId);
		return json(characterVersion ?? null);
	});
};

export const PUT: RequestHandler = async ({ cookies, request}) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.user]);
    const body = await request.json();
    if(isCharacterVersionBare(body) === false) throw new BadRequest();
    return  json(await characterVersionRepo.save(body));
	});
};
