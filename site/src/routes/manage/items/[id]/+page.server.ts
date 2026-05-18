import type { PageServerLoad } from './$types';
import { handleRequest } from '$lib/utils/request';

export const load: PageServerLoad = async ({ params, fetch }) => {
	return handleRequest(async () => {
		const {id} = params;
		if (id == null || typeof id != 'string') return { item: undefined};
		const item = await (await fetch(`/api/items/${id}`,{ method: 'GET' })).json();
		if (item == null) return { item: undefined};
		return { item };
	});
};


