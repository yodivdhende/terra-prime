import { userRepo } from '$lib/db/user.repo';
import { isNumberOrError } from '$lib/request.utils';
import { sendVerificationEmail } from '$lib/server/verification.service';
import { RequestError } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const numberId = isNumberOrError(params.id);
		const user = await userRepo.getById({ id: numberId });
		if (user.verified) throw new RequestError(400, 'email is already verified');
		await sendVerificationEmail(numberId, user.email);
		return json({ ok: true });
	});
};
