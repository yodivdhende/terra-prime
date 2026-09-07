import { json, type RequestHandler } from '@sveltejs/kit';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser } from '$lib/utils/request';
import { RequestError } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
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
 * Looks up a character by name and returns the difficulty for the hack.
 *
 * The error shapes here carry structured data (e.g. the candidate list on an
 * ambiguous name) that the generic `RequestError`/`error()` helper used
 * elsewhere in the app can't express, so this handles its own error mapping
 * rather than routing through `handleRequest`. Auth still uses the same
 * `RequestError` convention as every other route.
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		await authGuardForUser(getSessionToken(cookies), [UserRole.user]);
	} catch (err) {
		if (err instanceof RequestError) return err.getError();
		throw err;
	}

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
