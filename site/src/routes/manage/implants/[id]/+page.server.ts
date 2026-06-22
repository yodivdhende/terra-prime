import type { PageServerLoad } from './$types';
import { handleRequest } from '$lib/utils/request';

export const load: PageServerLoad = async ({ params, fetch }) => {
	return handleRequest(async () => {
		const { id } = params;
		if (id == null || typeof id != 'string') return { implant: undefined };
		const implant = await fetch(`/api/implants/${id}`, { method: 'GET' }).then((r) => r.json());
		if (implant == null) return { implant: undefined };
		return { implant };
	});
};
