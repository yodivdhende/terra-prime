import { json, type RequestHandler } from '@sveltejs/kit';
import {
	resolveActiveCharacter,
	AmbiguousCharacterError,
	CharacterNotFoundError,
	NoLiveEventError,
	NotInLiveEventError
} from '$lib/server/games/simon.service';
import { sequenceLengthFor } from '$lib/games/simon/difficulty';
import type { LookupError, LookupSuccess } from '$lib/games/simon/types';

/**
 * Looks up a character by name and returns the difficulty for the hack. No
 * auth gate: this is a walk-up terminal, open to whoever can reach it.
 *
 * The error shapes here carry structured data (e.g. the candidate list on an
 * ambiguous name) that the generic `RequestError`/`error()` helper used
 * elsewhere in the app can't express, so this handles its own error mapping
 * rather than routing through `handleRequest`.
 */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const name = typeof body?.name === 'string' ? body.name.trim() : '';
	const characterId = typeof body?.characterId === 'number' ? body.characterId : undefined;

	if (!name) {
		const payload: LookupError = { error: 'name-required', message: 'personage naam vereist' };
		return json(payload, { status: 400 });
	}

	try {
		const character = await resolveActiveCharacter(name, characterId);
		const payload: LookupSuccess = {
			character,
			sequenceLength: sequenceLengthFor(character.hackingXp)
		};
		return json(payload);
	} catch (err) {
		if (err instanceof AmbiguousCharacterError) {
			const payload: LookupError = {
				error: 'ambiguous',
				message: err.message,
				candidates: err.candidates
			};
			return json(payload, { status: 409 });
		}
		if (err instanceof CharacterNotFoundError) {
			const payload: LookupError = { error: 'not-found', message: err.message };
			return json(payload, { status: 404 });
		}
		if (err instanceof NotInLiveEventError) {
			const payload: LookupError = { error: 'not-in-live-event', message: err.message };
			return json(payload, { status: 422 });
		}
		if (err instanceof NoLiveEventError) {
			const payload: LookupError = { error: 'no-live-event', message: err.message };
			return json(payload, { status: 503 });
		}
		console.error('[games/simon] lookup failed', err);
		const payload: LookupError = { error: 'internal', message: 'er ging iets mis' };
		return json(payload, { status: 500 });
	}
};
