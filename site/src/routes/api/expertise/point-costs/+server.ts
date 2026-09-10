import { expertisePointCostsRepo, isExpertisePointCost } from '$lib/db/expertise_point_costs.repo';
import { BadRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), ['admin', 'user']);
		return json(await expertisePointCostsRepo.getAll());
	});
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const items = await request.json();
		if (!Array.isArray(items) || items.some((item) => isExpertisePointCost(item) === false)) {
			throw new BadRequest();
		}
		await expertisePointCostsRepo.saveAll(items);
		return new Response();
	});
};
