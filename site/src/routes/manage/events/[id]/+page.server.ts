import type { PageServerLoad } from './$types';
import { handleRequest } from '$lib/utils/request';
import type { EventParticipantCharacter } from '$lib/db/event_participants.repo';
import type { CharacterVersionFull } from '$lib/managers/character-manager.svelte';

export type EventParticipantWithVersion = {
	character: EventParticipantCharacter;
	version: CharacterVersionFull | null;
};

export const load: PageServerLoad = async ({ params, fetch }) => {
	return handleRequest(async () => {
		const { id } = params;
		if (id == null || typeof id != 'string') return { event: undefined, participants: [] };
		const event = await (await fetch(`/api/events/${id}`, { method: 'GET' }))?.json();
		if (event == null) return { event: undefined, participants: [] };

		const characters: EventParticipantCharacter[] = await (
			await fetch(`/api/events/${id}/participants`, { method: 'GET' })
		)?.json();

		const participants: EventParticipantWithVersion[] = await Promise.all(
			(characters ?? []).map(async (character) => {
				const versionRes = await fetch(
					`/api/characters/versions/${character.characterVersionId}/full`
				);
				const version = versionRes.ok ? ((await versionRes.json()) as CharacterVersionFull) : null;
				return { character, version };
			})
		);

		return { event, participants };
	});
};
