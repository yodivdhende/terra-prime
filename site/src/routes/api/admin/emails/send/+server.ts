import { sendTemplated } from '$lib/server/email.service';
import { RequestError } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), [UserRole.admin]);
		const { to, templateKey, link } = await request.json();
		if (typeof to !== 'string' || to.length === 0)
			throw new RequestError(400, 'to is required');
		if (typeof templateKey !== 'string' || templateKey.length === 0)
			throw new RequestError(400, 'templateKey is required');
		if (link != null && typeof link !== 'string')
			throw new RequestError(400, 'link must be a string when provided');
		await sendTemplated({ to, templateKey, link });
		return json({ ok: true });
	});
};
