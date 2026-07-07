import type { PageServerLoad } from './$types';
import { handleRequest } from '$lib/utils/request';

export const load: PageServerLoad = async ({ params, fetch }) => {
	return handleRequest(async () => {
		const { id } = params;
		if (id == null || typeof id != 'string') return { implant: undefined, characters: [] };
		const [implant, characters] = await Promise.all([
			fetch(`/api/implants/${id}`, { method: 'GET' }).then((r) => r.ok ? r.json() : undefined),
			fetch('/api/characters').then((r) => r.ok ? r.json() : [])
		]);
		return { implant: implant ?? undefined, characters };
	});
};
