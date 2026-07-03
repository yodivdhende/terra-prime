import { getGoogleDocsManager } from '$lib/managers/google-docs-manager';
import { BadRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['user']);
		const body = await request.json();
		if (typeof body?.characterName !== 'string' || body.characterName.trim().length === 0) {
			throw new BadRequest();
		}
		const docId = await getGoogleDocsManager().createBackstoryDoc(body.characterName.trim());
		return json({ id: docId });
	});
};
