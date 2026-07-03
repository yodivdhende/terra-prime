import { handleRequest } from '$lib/utils/request';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
	return handleRequest(async () => {
		const { id } = params;
		const [company, discounts, items, implants, skills] = await Promise.all([
			fetch(`/api/companies/${id}`).then((r) => r.json()),
			fetch(`/api/companies/${id}/discounts`).then((r) => r.json()),
			fetch('/api/items').then((r) => r.json()),
			fetch('/api/implants').then((r) => r.json()),
			fetch('/api/skills').then((r) => r.json())
		]);
		return { company, discounts, items, implants, skills };
	});
};
