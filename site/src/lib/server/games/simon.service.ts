/**
 * Server-only lookup chain for the Simon Says minigame: given a character name,
 * resolve that character's Software & Hacking experience for the version
 * registered to the most recent `Live` event.
 *
 * This runs in-process, inside the same server that owns the database — unlike
 * an HTTP client, it calls the repos directly rather than going through the
 * admin-gated `/api/events` and `/api/characters` routes, so no privileged
 * session token is needed here. The live-event and name-lookup steps mirror
 * `/api/characters/experience` — keep the two in sync if the lookup rules
 * ever change.
 */

import { characterRepo, type Character } from '$lib/db/character.repo';
import { characterVersionRepo } from '$lib/db/character_version.repo';
import { eventParticipantsRepo } from '$lib/db/event_participants.repo';
import { eventRepo } from '$lib/db/event.repo';
import { expertiseRepo, type Expertise } from '$lib/db/expertise.repo';
import { EventStatus } from '$lib/types/event-status';
import type { ActiveCharacterInfo, AmbiguousCandidate } from '$lib/games/simon/types';

/** Seed id of `Software & Hacking`. Production ids are AUTO_INCREMENT, so this
 * is only a fallback — matching the name is the primary strategy. */
const HACKING_EXPERTISE_ID = 6;
const HACKING_NAME_FRAGMENT = 'hack';

export class SimonLookupError extends Error {}

export class NoLiveEventError extends SimonLookupError {}

export class CharacterNotFoundError extends SimonLookupError {}

export class NotInLiveEventError extends SimonLookupError {}

export class AmbiguousCharacterError extends SimonLookupError {
	public readonly candidates: AmbiguousCandidate[];

	constructor(name: string, candidates: AmbiguousCandidate[]) {
		const owners = candidates.map((c) => `${c.name} (${c.ownerName})`).join(', ');
		super(`${candidates.length} characters named "${name}": ${owners}`);
		this.candidates = candidates;
	}
}

async function findLiveEvent() {
	const event = await eventRepo.getLatestWithStatus(EventStatus.Live);
	if (!event) throw new NoLiveEventError('no event currently has status Live');
	return event;
}

function toCandidate(character: Character): AmbiguousCandidate {
	return { id: character.id, name: character.name, ownerName: character.ownerName };
}

/** Pulls the hacking value out of a version's `{id, value}` expertise rows.
 * Matches on the name first, falling back to the seed id. A character who has
 * never bought hacking has no row at all — the site deletes the row when a
 * value drops to 0 — so an absent entry means 0, not an error. */
function hackingXpFromExpertise(
	entries: { id: number; value: number }[],
	expertiseById: Map<number, Expertise>
): number {
	let byId: number | null = null;
	for (const entry of entries) {
		const catalogName = expertiseById.get(entry.id)?.name;
		if (catalogName && catalogName.toLowerCase().includes(HACKING_NAME_FRAGMENT)) {
			return entry.value;
		}
		if (entry.id === HACKING_EXPERTISE_ID) byId = entry.value;
	}
	return byId ?? 0;
}

/**
 * Resolve `name` to the character's live-event version and hacking XP.
 * Pass `characterId` to disambiguate when a previous call threw
 * `AmbiguousCharacterError`.
 */
export async function resolveActiveCharacter(
	name: string,
	characterId?: number
): Promise<ActiveCharacterInfo> {
	const event = await findLiveEvent();
	const matches = await characterRepo.getByName(name);

	if (matches.length === 0) throw new CharacterNotFoundError(`no character named "${name}"`);

	let chosen: Character;
	if (characterId != null) {
		const found = matches.find((c) => c.id === characterId);
		if (!found) {
			throw new CharacterNotFoundError(`no character named "${name}" with id ${characterId}`);
		}
		chosen = found;
	} else if (matches.length > 1) {
		throw new AmbiguousCharacterError(name, matches.map(toCandidate));
	} else {
		chosen = matches[0];
	}

	if (event.id == null) throw new NoLiveEventError('live event has no id');

	const participant = await eventParticipantsRepo.getParticipantForCharacter({
		eventId: event.id,
		characterId: chosen.id
	});
	if (participant?.characterVersion == null) {
		throw new NotInLiveEventError(
			`character ${chosen.id} is not registered for event ${event.id}`
		);
	}

	const version = await characterVersionRepo.getWithId(participant.characterVersion);
	if (version == null || version.id == null) {
		throw new NotInLiveEventError(`version ${participant.characterVersion} not found`);
	}

	const expertiseCatalog = await expertiseRepo.getAll();
	const expertiseById = new Map(
		expertiseCatalog.flatMap((e) => (e.id == null ? [] : [[e.id, e] as const]))
	);

	return {
		id: chosen.id,
		name: chosen.name,
		ownerName: chosen.ownerName,
		versionId: version.id,
		versionName: version.name ?? '',
		eventId: event.id,
		eventName: event.name,
		hackingXp: hackingXpFromExpertise(version.expertise, expertiseById)
	};
}
