import { eventRepo, isLarpEvent, type LarpEvent } from '$lib/db/event.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), ['admin', 'user']);
		const numberId = isNumberOrError(params.eventId);
		const event = await eventRepo.getWithId(numberId);
		if(event == null) throw new NotFoundRequest();
		return json(event);
	});
};

export const DELETE: RequestHandler = async ({ cookies, params}) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const { eventId } = params;
		const numberId = isNumberOrError(eventId);
        eventRepo.delete({id: numberId});
		return new Response();
	});
};

export const POST: RequestHandler = async ({cookies, params, request}) => {
	return handleRequest(async ()=> {
		await authGuard(getSessionToken(cookies), ['admin']);
		const {eventId} = params;
		isNumberOrError(eventId);
		const body = await request.json();
		const event = {
			...body,
			start: body.start ? new Date(body.start) : null,
			end: body.end ? new Date(body.end) : null,
		}
		if(isLarpEvent(event) === false) throw new BadRequest();
		eventRepo.save(event);
		return new Response();
	})
}

