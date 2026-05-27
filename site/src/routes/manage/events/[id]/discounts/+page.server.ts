import { handleRequest } from '$lib/utils/request';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
	return handleRequest(async () => {
		const { id } = params;
		const [characters, discounts, items, implants, skills] = await Promise.all([
			fetch(`/api/characters`).then((r) => r.json()),
			fetch(`/api/events/${id}/discounts`).then((r) => r.json()),
			fetch('/api/items').then((r) => r.json()),
			fetch('/api/implants').then((r) => r.json()),
			fetch('/api/skills').then((r) => r.json())
		]);
		return { eventId: id, characters, discounts, items, implants, skills };
	});
};
