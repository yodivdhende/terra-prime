import type { PageServerLoad } from './$types';
import { handleRequest } from '$lib/utils/request';
import { loadEventParticipants, loadEventExtras } from '$lib/server/event-sheets';
import type { User } from '$lib/db/user.repo';

export type { EventParticipantWithVersion, EventExtraWithVersion } from '$lib/server/event-sheets';

/** A row of `GET /api/characters/versions` — the pool the "add participant" picker draws from. */
export type SelectableCharacterVersion = {
	id: number;
	name: string;
	characterId: number;
	characterName: string;
	ownerId: number;
	ownerName: string;
	kind: 'player' | 'npc';
};

const EMPTY = { event: undefined, participants: [], allVersions: [], extras: [], users: [] };

export const load: PageServerLoad = async ({ params, fetch }) => {
	return handleRequest(async () => {
		const { id } = params;
		if (id == null || typeof id != 'string') return EMPTY;
		const event = await (await fetch(`/api/events/${id}`, { method: 'GET' }))?.json();
		if (event == null) return EMPTY;

		const [participants, allVersions, extras, users] = await Promise.all([
			loadEventParticipants(fetch, id),
			fetch('/api/characters/versions', { method: 'GET' }).then(
				async (res): Promise<SelectableCharacterVersion[]> => (res.ok ? await res.json() : [])
			),
			loadEventExtras(fetch, id),
			fetch('/api/users', { method: 'GET' }).then(
				async (res): Promise<User[]> => (res.ok ? await res.json() : [])
			)
		]);

		return { event, participants, allVersions, extras, users };
	});
};
