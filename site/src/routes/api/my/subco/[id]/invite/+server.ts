import { isNumberOrError } from '$lib/request.utils';
import { BadRequest } from '$lib/types/errors';
import { assertUserBelongsToSubco } from '$lib/server/subco.service';
import { sendSubcoInvite } from '$lib/server/subco-invite.service';
import { subcoInviteRepo } from '$lib/db/subco_invite.repo';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), ['user']);
		const subcoId = isNumberOrError(params.id);
		await assertUserBelongsToSubco(userId, subcoId);
		const invites = await subcoInviteRepo.getBySubco({ subcoId });
		return new Response(JSON.stringify(invites), { headers: { 'content-type': 'application/json' } });
	});
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), ['user']);
		const subcoId = isNumberOrError(params.id);
		await assertUserBelongsToSubco(userId, subcoId);
		const body = await request.json();
		if (typeof body?.email !== 'string' || body.email.trim().length === 0) throw new BadRequest();
		await sendSubcoInvite({ subcoId, email: body.email.trim() });
		return new Response();
	});
};
