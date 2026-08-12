import { subcoInviteRepo } from '$lib/db/subco_invite.repo';
import { resendSubcoInvite } from '$lib/server/subco-invite.service';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		await resendSubcoInvite({ token: params.token! });
		return new Response();
	});
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		await subcoInviteRepo.deleteByToken({ token: params.token! });
		return new Response(null, { status: 204 });
	});
};
