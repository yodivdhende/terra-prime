import { subcoRepo } from '$lib/db/subco.repo';
import { BackstoryFolder, getGoogleDocsManager } from '$lib/managers/google-docs-manager';
import { isNumberOrError } from '$lib/request.utils';
import { NotFoundRequest, RequestError } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const subcoId = isNumberOrError(params.id);
		const subco = await subcoRepo.getWithId(subcoId);

		if (subco == null) {
			throw new NotFoundRequest('subco not found');
		}
		if (subco.backstoryId) {
			throw new RequestError(409, 'Backstory document already exists');
		}

		const docId = await getGoogleDocsManager().createBackstoryDoc(subco.name, BackstoryFolder.Subco);
		await subcoRepo.saveBackstoryId(subcoId, docId);

		return json({ id: docId });
	});
};
