import type { PageServerLoad } from './$types';
import { handleRequest } from '$lib/utils/request';
import { loadEventParticipants } from '$lib/server/event-sheets';

export const load: PageServerLoad = async ({ params, url, fetch }) => {
	return handleRequest(async () => {
		const { id } = params;
		if (id == null || typeof id != 'string') return { event: undefined, participants: [] };
		const event = await (await fetch(`/api/events/${id}`, { method: 'GET' }))?.json();
		if (event == null) return { event: undefined, participants: [] };

		const participants = await loadEventParticipants(fetch, id);

		// Absent `versionId` prints every participant; present narrows it to that one sheet.
		const versionId = Number(url.searchParams.get('versionId'));
		return {
			event,
			participants:
				Number.isFinite(versionId) && versionId > 0
					? participants.filter(({ character }) => character.characterVersionId === versionId)
					: participants
		};
	});
};
