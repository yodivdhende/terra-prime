import { characterRepo, isNewCharacter } from '$lib/db/character.repo';
import { BadRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		return json(await characterRepo.getAll());
	});
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin', 'user']);
		const body = await request.json();
		if (isNewCharacter(body) == false) throw new BadRequest();
		const id = await characterRepo.save(body);
		return json({ id });
	});
};

