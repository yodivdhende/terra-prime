import { resetPasswordWithToken } from '$lib/server/password_reset.service';
import { RequestError } from '$lib/types/errors';
import { handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	return handleRequest(async () => {
		const { token, password } = await request.json();
		if (typeof token !== 'string' || token.length === 0)
			throw new RequestError(400, 'token is required');
		if (typeof password !== 'string' || password.length < 8)
			throw new RequestError(400, 'password must be at least 8 characters');

		const userId = await resetPasswordWithToken(token, password);
		return json({ ok: true, userId });
	});
};
