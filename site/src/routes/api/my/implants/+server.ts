import { implantRepo } from '$lib/db/implants.repo';
import { resolveMyCharacterVersion } from '$lib/server/my-character.service';
import { handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';
import type { VersionImplant } from '../characters/versions/+server';

/**
 * The caller's own implants with their descriptions — the overview the AguesGuard's Implants
 * screen shows, ordered by the slot they sit in so the list matches the body.
 *
 * Charge counts belong here too once implants have them; there is nothing to report until that
 * lands, so the shape stays `VersionImplant` rather than guessing at a field.
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
		const { characterId, characterName, versionId, versionName, version } =
			await resolveMyCharacterVersion({ cookies, request, url });
		const catalog = await implantRepo.getWithIds(version.implants.map((i) => i.id));
		const byId = new Map(catalog.flatMap((i) => (i.id == null ? [] : [[i.id, i] as const])));

		const implants: VersionImplant[] = version.implants
			.flatMap((entry): VersionImplant[] => {
				const catalogEntry = byId.get(entry.id);
				if (catalogEntry == null) return [];
				return [
					{
						id: entry.id,
						name: catalogEntry.name,
						description: catalogEntry.description,
						slot: entry.slot
					}
				];
			})
			.sort((a, b) => a.slot - b.slot || a.name.localeCompare(b.name));

		const response: MyImplantsResponse = {
			characterId,
			characterName,
			versionId,
			versionName,
			implants
		};
		return json(response);
	});
};
