import type { PageServerLoad } from './$types';
import { handleRequest } from '$lib/utils/request';
import { loadEventParticipants, loadEventExtras } from '$lib/server/event-sheets';
import type { SheetEntry } from '$lib/server/event-sheets';

export type { SheetEntry } from '$lib/server/event-sheets';

export const load: PageServerLoad = async ({ params, url, fetch }) => {
	return handleRequest(async () => {
		const { id } = params;
		if (id == null || typeof id != 'string') return { event: undefined, sheets: [] };
		const event = await (await fetch(`/api/events/${id}`, { method: 'GET' }))?.json();
		if (event == null) return { event: undefined, sheets: [] };

		const [participants, extras] = await Promise.all([
			loadEventParticipants(fetch, id),
			loadEventExtras(fetch, id)
		]);

		const playerSheets: SheetEntry[] = participants.map(({ character, version }) => ({
			characterVersionId: character.characterVersionId,
			characterName: character.name,
			ownerName: character.ownerName,
			version
		}));

		const extraSheets: SheetEntry[] = extras
			.filter(({ extra }) => extra.characterVersionId != null && extra.characterName != null)
			.map(({ extra, version }) => ({
				characterVersionId: extra.characterVersionId as number,
				characterName: extra.characterName as string,
				ownerName: extra.userName,
				version
			}));

		const sheets = [...playerSheets, ...extraSheets];

		// Absent `versionId` prints every sheet; present narrows it to that one.
		const versionId = Number(url.searchParams.get('versionId'));
		return {
			event,
			sheets:
				Number.isFinite(versionId) && versionId > 0
					? sheets.filter((sheet) => sheet.characterVersionId === versionId)
					: sheets
		};
	});
};
