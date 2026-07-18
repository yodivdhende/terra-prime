import { subcoRepo, isSubco } from '$lib/db/subco.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import {
	assertUserBelongsToSubco,
	assertUserIsSubcoOwner,
	userOwnsSubcoMember
} from '$lib/server/subco.service';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), ['user']);
		const id = isNumberOrError(params.id);
		await assertUserBelongsToSubco(userId, id);
		const subco = await subcoRepo.getWithId(id);
		if (subco == null) throw new NotFoundRequest();
		return json(subco);
	});
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), ['user']);
		const id = isNumberOrError(params.id);
		await assertUserBelongsToSubco(userId, id);
		const subco = await request.json();
		if (isSubco(subco) === false) throw new BadRequest();
		if (subco.id !== id) throw new BadRequest('id mismatch');
		// The player must keep at least one of their own characters as a member.
		if ((await userOwnsSubcoMember(userId, subco.members)) === false) {
			throw new BadRequest('a subco must include a character you own');
		}
		const existing = await subcoRepo.getWithId(id);
		if (existing == null) throw new NotFoundRequest();
		// Only the owner may rename the subco; ownership itself is preserved
		// here and only changes via the admin transfer endpoint.
		if (subco.name !== existing.name) assertUserIsSubcoOwner(userId, existing);
		await subcoRepo.save({ ...subco, ownerId: existing.ownerId });
		return new Response();
	});
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), ['user']);
		const id = isNumberOrError(params.id);
		await assertUserBelongsToSubco(userId, id);
		await subcoRepo.delete({ id });
		return new Response();
	});
};
