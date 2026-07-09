import { eventCouponRepo } from '$lib/db/event_coupon.repo';
import { isNumberOrError } from '$lib/request.utils';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), ['user']);
		const eventId = isNumberOrError(params.eventId);
		const coupon = await eventCouponRepo.findUnredeemedByCode(eventId, userId, params.code ?? '');
		return json(coupon ? { valid: true, value: coupon.value } : { valid: false, value: 0 });
	});
};
