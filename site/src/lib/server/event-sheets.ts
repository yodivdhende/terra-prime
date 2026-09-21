import type { EventPlayerCharacter } from '$lib/db/event_players.repo';
import type { EventExtra } from '$lib/db/event_extras.repo';
import type { CharacterVersionFull } from '$lib/managers/character-manager.svelte';

export type EventParticipantWithVersion = {
	character: EventPlayerCharacter;
	version: CharacterVersionFull | null;
};

export type EventExtraWithVersion = {
	extra: EventExtra;
	version: CharacterVersionFull | null;
};

/** One printable sheet — a player's own character, or an NPC version assigned to an extra. */
export type SheetEntry = {
	characterVersionId: number;
	characterName: string;
	ownerName: string | null;
	version: CharacterVersionFull | null;
};

/**
 * Participants of an event, each hydrated with its full character version. Shared by the event
 * manage page and the printable sheets page so both read the same shape.
 */
export async function loadEventParticipants(
	fetch: typeof globalThis.fetch,
	eventId: string
): Promise<EventParticipantWithVersion[]> {
	const characters: EventPlayerCharacter[] = await (
		await fetch(`/api/events/${eventId}/participants`, { method: 'GET' })
	)?.json();

	return Promise.all(
		(characters ?? []).map(async (character) => {
			const versionRes = await fetch(
				`/api/characters/versions/${character.characterVersionId}/full`
			);
			const version = versionRes.ok ? ((await versionRes.json()) as CharacterVersionFull) : null;
			return { character, version };
		})
	);
}

/**
 * Extras enrolled at an event, each hydrated with the full version of the NPC assigned to them,
 * if any. As `loadEventParticipants`, but a fetch is skipped when nothing has been assigned yet.
 */
export async function loadEventExtras(
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
