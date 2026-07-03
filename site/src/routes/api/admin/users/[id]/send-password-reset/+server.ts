import { userRepo } from '$lib/db/user.repo';
import { isNumberOrError } from '$lib/request.utils';
import { sendPasswordResetEmail } from '$lib/server/password_reset.service';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const numberId = isNumberOrError(params.id);
		const user = await userRepo.getById({ id: numberId });
		await sendPasswordResetEmail(numberId, user.email);
		return json({ ok: true });
	});
};
