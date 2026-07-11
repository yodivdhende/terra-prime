import { eventCouponRepo } from '$lib/db/event_coupon.repo';
import { isNumberOrError } from '$lib/request.utils';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import type { RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const couponId = isNumberOrError(params.couponId);
		await eventCouponRepo.delete(couponId);
		return new Response();
	});
};
