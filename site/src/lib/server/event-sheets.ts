import type { EventPlayerCharacter } from '$lib/db/event_players.repo';
import type { CharacterVersionFull } from '$lib/managers/character-manager.svelte';

export type EventParticipantWithVersion = {
	character: EventPlayerCharacter;
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
