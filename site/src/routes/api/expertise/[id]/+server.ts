import { isExpertise, expertiseRepo } from '$lib/db/expertise.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), ['admin']);
		const { id } = params;
		const numberId = isNumberOrError(id);
		const expertise = await expertiseRepo.getWithId(numberId);
		if (expertise == null) throw new NotFoundRequest();
		return json(expertise);
	});
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const { id } = params;
		const numberId = isNumberOrError(id);
		expertiseRepo.delete({ id: numberId });
		return new Response();
	});
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const { id } = params;
		const numberId = isNumberOrError(id);
		const item = await request.json();
		if (isExpertise(item) === false) throw new BadRequest();
		await expertiseRepo.save(item);
		await expertiseRepo.setCharacterAccess(
			numberId,
			item.characterAccess ?? 'all',
			item.allowedCharacterIds ?? []
		);
		return new Response();
	});
};
