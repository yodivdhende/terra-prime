import { handleRequest } from '$lib/utils/request';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params, locals }) => {
	return handleRequest(async () => {
		const { id } = params;
		const [coupons, allUsers] = await Promise.all([
			fetch(`/api/events/${id}/coupons`).then((r) => r.json()),
			fetch(`/api/users`).then((r) => r.json())
		]);
		return { eventId: id, coupons, allUsers, couponsEnabled: locals.featureFlags['Coupons'] ?? false };
	});
};
