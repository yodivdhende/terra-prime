import { type Expertise } from '$lib/db/expertise.repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const expertiseRequest = await fetch('/api/expertise');
	const expertise: Expertise[] = await expertiseRequest.json();
	return { expertise };
};
