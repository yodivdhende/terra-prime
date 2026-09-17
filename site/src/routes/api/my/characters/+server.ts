import { characterRepo } from '$lib/db/character.repo';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), ['user']);
		const characters = await characterRepo.getForUser(userId);
		// An admin owns the NPC pool they author; those are not characters they play.
		return json(characters.filter((character) => character.kind === 'player'));
	});
};
