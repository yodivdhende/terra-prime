import { resolveMyCharacterVersion } from '$lib/server/my-character.service';
import { handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

/**
 * The one character version the caller is playing, as opposed to `/api/my/characters`, which lists
 * everything they own. This is what an AguesGuard fetches at boot to fill its header, and what a
 * player gets for the same character in a browser.
 */
export type MyCharacterResponse = {
	id: number;
	name: string;
	versionId: number;
	versionName: string;
	companyId: number;
};

export const GET: RequestHandler = async ({ cookies, request, url }) => {
	return handleRequest(async () => {
		const { characterId, characterName, versionId, versionName, version } =
			await resolveMyCharacterVersion({ cookies, request, url });
		const response: MyCharacterResponse = {
			id: characterId,
			name: characterName,
			versionId,
			versionName,
			companyId: version.company
		};
		return json(response);
	});
};
