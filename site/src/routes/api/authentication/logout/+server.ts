import { sessionRepo } from '$lib/db/session.repo';
import { setPotentialSessionToken } from '$lib/utils/cookies';
import { handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		const token = setPotentialSessionToken(cookies);
		if (token) {
			await sessionRepo.delete(token);
			cookies.delete('session-token', { path: '/' });
		}
		return json({ ok: true });
	});
};
