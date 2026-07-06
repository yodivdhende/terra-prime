import type { PageServerLoad } from './$types';
import { handleRequest } from '$lib/utils/request';
import type { EventParticipantCharacter } from '$lib/db/event_participants.repo';
import type { CharacterVersionFull } from '$lib/codex/managers/character-manager.svelte';

export type EventParticipantWithVersion = {
	character: EventParticipantCharacter;
	version: CharacterVersionFull | null;
};

export const load: PageServerLoad = async ({ params, fetch }) => {
	return handleRequest(async () => {
		const { id } = params;
		if (id == null || typeof id != 'string')
			return { event: undefined, participants: [], skills: [] };
		const event = await (await fetch(`/api/events/${id}`, { method: 'GET' }))?.json();
		if (event == null) return { event: undefined, participants: [], skills: [] };

		const characters: EventParticipantCharacter[] = await (
			await fetch(`/api/events/${id}/participants`, { method: 'GET' })
		)?.json();

		const [participants, skillsRes] = await Promise.all([
			Promise.all(
				(characters ?? []).map(async (character) => {
					const versionRes = await fetch(
						`/api/characters/versions/${character.characterVersionId}/full`
					);
					const version = versionRes.ok
						? ((await versionRes.json()) as CharacterVersionFull)
						: null;
					return { character, version };
				})
			),
			fetch('/api/skills')
		]);
		const skills = skillsRes.ok ? await skillsRes.json() : [];

		return { event, participants, skills };
	});
};
