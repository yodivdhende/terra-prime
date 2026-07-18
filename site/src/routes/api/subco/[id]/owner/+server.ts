import { subcoRepo } from '$lib/db/subco.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const id = isNumberOrError(params.id);
		const subco = await subcoRepo.getWithId(id);
		if (subco == null) throw new NotFoundRequest();
		const body = await request.json();
		if (typeof body?.ownerId !== 'number' || isNaN(body.ownerId)) {
			throw new BadRequest('ownerId is required');
		}
		await subcoRepo.transferOwner(id, body.ownerId);
		return new Response();
	});
};
