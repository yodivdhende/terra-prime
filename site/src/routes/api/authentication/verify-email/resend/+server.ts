import { userRepo } from '$lib/db/user.repo';
import { sendVerificationEmail } from '$lib/server/verification.service';
import { RequestError } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), [UserRole.user, UserRole.admin]);
		const user = await userRepo.getById({ id: userId });
		if (user.verified) throw new RequestError(400, 'email is already verified');
		await sendVerificationEmail(userId, user.email);
		return json({ ok: true });
	});
};
