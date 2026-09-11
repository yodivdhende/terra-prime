import { subcoRepo, isSubco } from '$lib/db/subco.repo';
import { BadRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		return json(await subcoRepo.getAll());
	});
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const subco = await request.json();
		if (isSubco(subco) === false) throw new BadRequest();
		await subcoRepo.save(subco);
		return new Response();
	});
};
