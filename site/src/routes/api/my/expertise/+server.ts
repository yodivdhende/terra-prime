import { expertiseRepo } from '$lib/db/expertise.repo';
import { resolveMyCharacterVersion } from '$lib/server/my-character.service';
import { handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';
import type { VersionExpertise } from '../characters/versions/+server';

/**
 * The caller's own expertise, resolved against the catalog so a client has everything it needs to
 * draw a bar per entry: the value, the name, and the icon/colour the group carries.
 *
 * Entries are ordered by group and then by name, so the AguesGuard's Expertise screen and the site
 * show the same list in the same order without either of them sorting.
 *
 * `icon` and `groupIcon` are sent as null to an AguesGuard. They are full SVG documents — several
 * kilobytes each, and this route can carry a dozen — which an ESP32 can neither render nor afford
 * to hold in the JSON document it parses beside LVGL's frame buffers. `groupColor` survives, and is
 * what the device tints its bars with.
 */
export type MyExpertiseResponse = {
	characterId: number;
	characterName: string;
	versionId: number;
	versionName: string;
	expertise: VersionExpertise[];
};

export const GET: RequestHandler = async ({ cookies, request, url }) => {
	return handleRequest(async () => {
		const { characterId, characterName, versionId, versionName, version, via } =
			await resolveMyCharacterVersion({ cookies, request, url });
		const catalog = await expertiseRepo.getWithIds(version.expertise.map((e) => e.id));
		const byId = new Map(catalog.flatMap((e) => (e.id == null ? [] : [[e.id, e] as const])));
		const withIcons = via !== 'device';

		const expertise: VersionExpertise[] = version.expertise
			.flatMap((entry): VersionExpertise[] => {
				const catalogEntry = byId.get(entry.id);
				if (catalogEntry == null) return [];
				return [
					{
						id: entry.id,
						name: catalogEntry.name,
						group: catalogEntry.groupId,
						groupName: catalogEntry.groupName,
						value: entry.value,
						icon: withIcons ? (catalogEntry.icon ?? null) : null,
						groupIcon: withIcons ? (catalogEntry.groupIcon ?? null) : null,
						groupColor: catalogEntry.groupColor ?? null
					}
				];
			})
			.sort((a, b) => a.groupName.localeCompare(b.groupName) || a.name.localeCompare(b.name));

		const response: MyExpertiseResponse = {
			characterId,
			characterName,
			versionId,
			versionName,
			expertise
		};
		return json(response);
	});
};
