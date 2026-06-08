import type { Implant } from '$lib/db/implants.repo';
import type { PageServerLoad } from './$types';
import { handleRequest } from '$lib/utils/request';

export const load: PageServerLoad = async ({ params, fetch }) => {
	return handleRequest(async () => {
		const { id } = params;
		if (id == null || typeof id != 'string') return { implant: undefined, allImplants: [] };
		const [implant, allImplants] = await Promise.all([
			fetch(`/api/implants/${id}`, { method: 'GET' }).then((r) => r.json()),
			fetch('/api/implants', { method: 'GET' }).then((r) => r.json() as Promise<Implant[]>)
		]);
		if (implant == null) return { implant: undefined, allImplants: [] };
		return { implant, allImplants };
	});
};
