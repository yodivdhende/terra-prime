import { type Expertise, type ExpertiseGroup } from '$lib/db/expertise.repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const [expertiseRequest, groupsRequest] = await Promise.all([
		fetch('/api/expertise'),
		fetch('/api/expertise/groups')
	]);
	const expertise: Expertise[] = await expertiseRequest.json();
	// Only their icons are used here, for the AguesGuard icon pack.
	const groups: ExpertiseGroup[] = await groupsRequest.json();
	return { expertise, groups };
};
