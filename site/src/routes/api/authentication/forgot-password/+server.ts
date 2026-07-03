import { userRepo } from '$lib/db/user.repo';
import { sendPasswordResetEmail } from '$lib/server/password_reset.service';
import { RequestError } from '$lib/types/errors';
import { handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	return handleRequest(async () => {
		const { email } = await request.json();
		if (typeof email !== 'string' || email.length === 0)
			throw new RequestError(400, 'email is required');

		try {
			const user = await userRepo.getByEmail({ email });
			const userId = Number(user.id);
			sendPasswordResetEmail(userId, user.email).catch((err) => {
				console.error('[forgot-password] failed to send reset email:', err);
			});
		} catch (err) {
			console.warn('[forgot-password] no user for email or lookup failed:', err);
		}

		return json({ ok: true });
	});
};
