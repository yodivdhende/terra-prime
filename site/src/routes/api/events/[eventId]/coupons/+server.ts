import { eventCouponRepo } from '$lib/db/event_coupon.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const eventId = isNumberOrError(params.eventId);
		return json(await eventCouponRepo.getAllByEvent(eventId));
	});
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const eventId = isNumberOrError(params.eventId);
		const body = await request.json();
		if (typeof body?.userId !== 'number' || typeof body?.value !== 'number') throw new BadRequest();
		const coupon = await eventCouponRepo.create(eventId, body.userId, body.value);
		return json(coupon);
	});
};
