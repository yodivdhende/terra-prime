import type { PageServerLoad } from './$types';
import { handleRequest } from '$lib/utils/request';
import { loadEventParticipants } from '$lib/server/event-sheets';
import type { EventExtra } from '$lib/db/event_extras.repo';
import type { CharacterVersionFull } from '$lib/managers/character-manager.svelte';
import type { User } from '$lib/db/user.repo';

export type { EventParticipantWithVersion } from '$lib/server/event-sheets';

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

/** An extras row, hydrated with the assigned version so the table can preview it. */
export type EventExtraWithVersion = {
	extra: EventExtra;
	version: CharacterVersionFull | null;
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

/** As `loadEventParticipants`, but an extra may have no version yet, so the fetch is conditional. */
async function loadEventExtras(
	fetch: typeof globalThis.fetch,
	eventId: string
): Promise<EventExtraWithVersion[]> {
	const res = await fetch(`/api/events/${eventId}/extras`, { method: 'GET' });
	if (!res.ok) return [];
	const extras: EventExtra[] = await res.json();

	return Promise.all(
		(extras ?? []).map(async (extra) => {
			if (extra.characterVersionId == null) return { extra, version: null };
			const versionRes = await fetch(`/api/characters/versions/${extra.characterVersionId}/full`);
			const version = versionRes.ok ? ((await versionRes.json()) as CharacterVersionFull) : null;
			return { extra, version };
		})
	);
}
