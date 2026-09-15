import type { PageServerLoad } from './$types';
import { handleRequest } from '$lib/utils/request';
import { loadEventParticipants } from '$lib/server/event-sheets';

export type { EventParticipantWithVersion } from '$lib/server/event-sheets';

export const load: PageServerLoad = async ({ params, fetch }) => {
	return handleRequest(async () => {
		const { id } = params;
		if (id == null || typeof id != 'string') return { event: undefined, participants: [] };
		const event = await (await fetch(`/api/events/${id}`, { method: 'GET' }))?.json();
		if (event == null) return { event: undefined, participants: [] };

		return { event, participants: await loadEventParticipants(fetch, id) };
	});
};
