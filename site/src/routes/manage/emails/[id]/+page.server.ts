import { handleRequest } from '$lib/utils/request';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	return handleRequest(async () => {
		const { id } = params;
		if (id == null || typeof id !== 'string') return { template: undefined };
		const res = await fetch(`/api/email-templates/${id}`);
		if (res.ok === false) return { template: undefined };
		const template = await res.json();
		return { template };
	});
};
