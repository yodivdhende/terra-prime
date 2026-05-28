import { handleRequest } from '$lib/utils/request';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
	return handleRequest(async () => {
		const { id } = params;
		const [participants, budgets] = await Promise.all([
			fetch(`/api/events/${id}/participants`).then((r) => r.json()),
			fetch(`/api/events/${id}/budget`).then((r) => r.json())
		]);
		return { eventId: id, participants, budgets };
	});
};
