import type { PageServerLoad } from './$types';
import { handleRequest } from '$lib/utils/request';
import { loadEventParticipants } from '$lib/server/event-sheets';

export type { EventParticipantWithVersion } from '$lib/server/event-sheets';

/** A row of `GET /api/characters/versions` — the pool the "add participant" picker draws from. */
export type SelectableCharacterVersion = {
	id: number;
	name: string;
	characterId: number;
	characterName: string;
	ownerId: number;
	ownerName: string;
};

export const load: PageServerLoad = async ({ params, fetch }) => {
	return handleRequest(async () => {
		const { id } = params;
		if (id == null || typeof id != 'string')
			return { event: undefined, participants: [], allVersions: [] };
		const event = await (await fetch(`/api/events/${id}`, { method: 'GET' }))?.json();
		if (event == null) return { event: undefined, participants: [], allVersions: [] };

		const [participants, allVersions] = await Promise.all([
			loadEventParticipants(fetch, id),
			fetch('/api/characters/versions', { method: 'GET' }).then(
				async (res): Promise<SelectableCharacterVersion[]> => (res.ok ? await res.json() : [])
			)
		]);

		return { event, participants, allVersions };
	});
};
