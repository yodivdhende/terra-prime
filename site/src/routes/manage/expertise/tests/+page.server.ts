import type { Expertise, ExpertiseGroup } from '$lib/db/expertise.repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const [expertiseResponse, groupsResponse] = await Promise.all([
		fetch('/api/expertise'),
		fetch('/api/expertise/groups')
	]);
	const expertise: Expertise[] = expertiseResponse.ok ? await expertiseResponse.json() : [];
	const groups: ExpertiseGroup[] = groupsResponse.ok ? await groupsResponse.json() : [];
	return { expertise, groups };
};
