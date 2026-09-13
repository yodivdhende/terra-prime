import { resolveMyCharacterVersion } from '$lib/server/my-character.service';
import { myImplants } from '$lib/server/my-implants.service';
import { handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';
import type { VersionImplant } from '../characters/versions/+server';

/**
 * The caller's own implants with their descriptions — the overview the AguesGuard's Implants
 * screen shows, ordered by the slot they sit in so the list matches the body.
 *
 * Every entry carries `maxCharges`/`chargesRemaining`; an implant that is not an activated one
 * reports `0`/`0`, which is what the screen reads as "nothing to press".
 */
export type MyImplantsResponse = {
	characterId: number;
	characterName: string;
	versionId: number;
	versionName: string;
	implants: VersionImplant[];
};

export const GET: RequestHandler = async ({ cookies, request, url }) => {
	return handleRequest(async () => {
		const { characterId, characterName, versionId, versionName } = await resolveMyCharacterVersion({
			cookies,
			request,
			url
		});

		const response: MyImplantsResponse = {
			characterId,
			characterName,
			versionId,
			versionName,
			implants: await myImplants(versionId)
		};
		return json(response);
	});
};
