import { subcoRepo, isSubco } from '$lib/db/subco.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const id = isNumberOrError(params.id);
		const subco = await subcoRepo.getWithId(id);
		if (subco == null) throw new NotFoundRequest();
		return json(subco);
	});
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		isNumberOrError(params.id);
		const subco = await request.json();
		if (isSubco(subco) === false) throw new BadRequest();
		await subcoRepo.save(subco);
		return new Response();
	});
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const id = isNumberOrError(params.id);
		await subcoRepo.delete({ id });
		return new Response();
	});
};
