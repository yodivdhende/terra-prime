import { characterRepo } from '$lib/db/character.repo';
import { characterVersionRepo } from '$lib/db/character_version.repo';
import { eventRepo } from '$lib/db/event.repo';
import { eventParticipantsRepo } from '$lib/db/event_participants.repo';
import { expertiseRepo } from '$lib/db/expertise.repo';
import { EventStatus } from '$lib/types/event-status';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import { handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';
import type { VersionExpertise } from '../../my/characters/versions/+server';

export type CharacterExperienceResponse = {
	characterId: number;
	characterName: string;
	ownerName: string;
	eventId: number;
	eventName: string;
	versionId: number;
	versionName: string;
	expertise: VersionExpertise[];
};

/**
 * No auth gate: this is meant to be called by devices (e.g. the CYD tabletop
 * prop) and the /games/simon terminal alike, neither of which should need a
 * session token just to look up a character's experience by name.
 */
export const POST: RequestHandler = async ({ request }) => {
	return handleRequest(async () => {
		const body = await request.json();
		const name = typeof body?.name === 'string' ? body.name.trim() : '';
		if (name.length === 0) throw new BadRequest('name is required');

		const [event, candidates, expertiseCatalog] = await Promise.all([
			eventRepo.getLatestWithStatus(EventStatus.Live),
			characterRepo.getByName(name),
			expertiseRepo.getAll()
		]);

		if (!event || event.id == null) throw new NotFoundRequest('no event currently has status Live');
		if (candidates.length === 0) throw new NotFoundRequest(`no character named "${name}"`);
		if (candidates.length > 1) {
			throw new BadRequest(
				`${candidates.length} characters named "${name}": ` +
					candidates.map((c) => `${c.name} (${c.ownerName})`).join(', ')
			);
		}
		const [character] = candidates;

		const participant = await eventParticipantsRepo.getParticipantForCharacter({
			eventId: event.id,
			characterId: character.id
		});
		if (!participant) throw new NotFoundRequest(`"${name}" is not registered for the live event`);

		const version = await characterVersionRepo.getWithId(participant.characterVersion);
		if (!version) throw new NotFoundRequest('character version not found');

		const expertiseById = new Map(
			expertiseCatalog.flatMap((e) => (e.id == null ? [] : [[e.id, e] as const]))
		);
		const expertise: VersionExpertise[] = version.expertise.flatMap((e): VersionExpertise[] => {
			const entry = expertiseById.get(e.id);
			if (!entry) return [];
			return [
				{
					id: e.id,
					name: entry.name,
					group: entry.groupId,
					groupName: entry.groupName,
					value: e.value,
					icon: entry.icon ?? null,
					groupIcon: entry.groupIcon ?? null,
					groupColor: entry.groupColor ?? null
				}
			];
		});

		const response: CharacterExperienceResponse = {
			characterId: character.id,
			characterName: character.name,
			ownerName: character.ownerName,
			eventId: event.id,
			eventName: event.name,
			versionId: version.id ?? participant.characterVersion,
			versionName: version.name,
			expertise
		};
		return json(response);
	});
};
