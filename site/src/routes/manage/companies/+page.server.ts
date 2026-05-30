import type { Company } from '$lib/db/companies.repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const response = await fetch('/api/companies');
	const companies: Company[] = await response.json();
	return { companies };
};
