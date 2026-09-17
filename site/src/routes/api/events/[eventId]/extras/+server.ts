import { characterRepo } from '$lib/db/character.repo';
import { characterVersionRepo } from '$lib/db/character_version.repo';
import { eventExtrasRepo } from '$lib/db/event_extras.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

/**
 * The admin side of extras: who is crewing this event, and which NPC versions they hold.
 * Players go through `../participants` — the two never share a row.
 */
export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const eventId = isNumberOrError(params.eventId);
		return json(await eventExtrasRepo.getForEvent({ eventId }));
	});
};

/** Enrol a user as an extra for this event. Body: `{ userId }`. */
export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const eventId = isNumberOrError(params.eventId);
		const body = await request.json();
		if (typeof body?.userId !== 'number') throw new BadRequest();
		await eventExtrasRepo.enrol({ eventId, userId: body.userId });
		return new Response();
	});
};

/** Assign an NPC version to an enrolled extra. Body: `{ userId, characterVersionId }`. */
export const PUT: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const eventId = isNumberOrError(params.eventId);
		const body = await request.json();
		if (typeof body?.userId !== 'number' || typeof body?.characterVersionId !== 'number')
			throw new BadRequest();

		const version = await characterVersionRepo.getWithId(body.characterVersionId);
		if (version == null) throw new NotFoundRequest('character version not found');

		const character = await characterRepo.getById(version.characterId);
		if (character.kind !== 'npc') throw new BadRequest('only npc characters can be assigned to an extra');

		// Assigning to someone who is not crewing this event would enrol them by accident; make the
		// admin add them as an extra first, so the two steps stay visible in the UI.
		const enrolment = await eventExtrasRepo.getEnrolment({ eventId, userId: body.userId });
		if (enrolment == null) throw new BadRequest('user is not enrolled as an extra for this event');

		await eventExtrasRepo.assign({
			eventId,
			userId: body.userId,
			characterVersionId: body.characterVersionId
		});
		return new Response();
	});
};

/**
 * Unassign one version, or — with `characterVersionId` omitted — remove the extra from the event
 * entirely. Body: `{ userId, characterVersionId? }`.
 */
export const DELETE: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const eventId = isNumberOrError(params.eventId);
		const body = await request.json();
		if (typeof body?.userId !== 'number') throw new BadRequest();

		if (body.characterVersionId == null) {
			await eventExtrasRepo.withdraw({ eventId, userId: body.userId });
			return new Response();
		}
		if (typeof body.characterVersionId !== 'number') throw new BadRequest();
		await eventExtrasRepo.unassign({ eventId, characterVersionId: body.characterVersionId });
		return new Response();
	});
};
