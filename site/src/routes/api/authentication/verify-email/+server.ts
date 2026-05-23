import { RequestError } from '$lib/types/errors';
import { confirmToken } from '$lib/server/verification.service';
import { handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	return handleRequest(async () => {
		const { token } = await request.json();
		if (typeof token !== 'string' || token.length === 0)
			throw new RequestError(400, 'token is required');
		const userId = await confirmToken(token);
		return json({ ok: true, userId });
	});
};
