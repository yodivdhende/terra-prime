import { characterRepo } from '$lib/db/character.repo';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), ['user']);
		return json(await characterRepo.getForUser(userId));
	});
};
