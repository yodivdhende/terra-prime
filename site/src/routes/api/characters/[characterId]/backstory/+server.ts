import { characterRepo } from '$lib/db/character.repo';
import { getGoogleDocsManager } from '$lib/managers/google-docs-manager';
import { isNumberOrError } from '$lib/request.utils';
import { RequestError } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['user']);
		const characterId = isNumberOrError(params.characterId);
		const character = await characterRepo.getById(characterId);

		if (character.backstoryId) {
			throw new RequestError(409, 'Backstory document already exists');
		}

		const docId = await getGoogleDocsManager().createBackstoryDoc(character.name);
		await characterRepo.saveBackstoryId(characterId, docId);

		return json({ id: docId });
	});
};
