import { handleRequest } from "$lib/utils/request";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, fetch }) => {
	return handleRequest(async () => {
		const {id} = params;
		if (id == null || typeof id != 'string') return { group: undefined};

		const group = await (await fetch(`/api/skills/groups/${id}`,{ method: 'GET' })).json();
		if (group == null) return { group: undefined};

		return { group};
	});
};