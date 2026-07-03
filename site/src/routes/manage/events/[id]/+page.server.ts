import type { PageServerLoad } from './$types';
import { handleRequest } from '$lib/utils/request';

export const load: PageServerLoad = async ({ params, fetch }) => {
	return handleRequest(async () => {
		const {id} = params;
		if (id == null || typeof id != 'string') return { event: undefined};
		const event = await (await fetch(`/api/events/${id}`,{ method: 'GET' }))?.json();
		if (event == null) return { event: undefined};
		return { event };
	});
};


