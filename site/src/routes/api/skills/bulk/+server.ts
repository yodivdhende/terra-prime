import { isSkill, skillRepo } from '$lib/db/skills.repo';
import { BadRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const items = await request.json();
		if (!Array.isArray(items) || items.some((item) => isSkill(item) === false)) {
			throw new BadRequest();
		}
		await skillRepo.saveBulk(items);
		return new Response();
	});
};
