import { subcoRepo, isSubco } from '$lib/db/subco.repo';
import { BadRequest } from '$lib/types/errors';
import { userOwnsSubcoMember } from '$lib/server/subco.service';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), ['user']);
		return json(await subcoRepo.getForUser(userId));
	});
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), ['user']);
		const subco = await request.json();
		if (isSubco(subco) === false) throw new BadRequest();
		if (subco.id != null) throw new BadRequest('use the [id] endpoint to update');
		// A player may only create a subco that includes one of their characters.
		if ((await userOwnsSubcoMember(userId, subco.members)) === false) {
			throw new BadRequest('a subco must include a character you own');
		}
		const id = await subcoRepo.create(subco);
		return json({ id });
	});
};
