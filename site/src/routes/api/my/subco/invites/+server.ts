import { subcoInviteRepo } from '$lib/db/subco_invite.repo';
import { userRepo } from '$lib/db/user.repo';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), ['user']);
		const { email } = await userRepo.getById({ id: userId });
		const invites = await subcoInviteRepo.getPendingForEmail({ email });
		return new Response(JSON.stringify(invites), { headers: { 'content-type': 'application/json' } });
	});
};
