import type { PageServerLoad } from './$types';
import { handleRequest } from '$lib/utils/request';

export const load: PageServerLoad = async ({ params, fetch }) => {
	return handleRequest(async () => {
		const {id} = params;
		if (id == null || typeof id != 'string') return { item: undefined, characters: [] };
		const [item, characters] = await Promise.all([
			fetch(`/api/items/${id}`, { method: 'GET' }).then((r) => r.ok ? r.json() : undefined),
			fetch('/api/characters').then((r) => r.ok ? r.json() : [])
		]);
		return { item: item ?? undefined, characters };
	});
};
