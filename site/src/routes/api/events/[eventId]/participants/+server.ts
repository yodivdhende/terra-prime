import { eventParticipantsRepo, isEventParticapant } from '$lib/db/event_participants.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), ['admin']);
        const { id: eventId} = params;
		const numberId = isNumberOrError(eventId);
		return json(await eventParticipantsRepo.getPerticipants({eventId: numberId}));
	});
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const {eventId, userId, characterVerionId} = await request.json();
		await eventParticipantsRepo.participate({
			eventId: isNumberOrError(eventId),
			userId: isNumberOrError(userId),
			characterVersionId: isNumberOrError(characterVerionId),
		});
		return new Response();
	});
};

export const DELETE: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const body = await request.json();
		if (isEventParticapant(body) == false) throw new BadRequest();
		await eventParticipantsRepo.withdraw({ eventId: body.eventId, characterVersionId: body.characterVersion });
		return new Response();
	});
};



