import type { ExpertiseGroup } from "$lib/db/expertise.repo";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch }) => {
	const expertiseRequest = await fetch('/api/expertise/groups');
	const groups: ExpertiseGroup[] = await expertiseRequest.json();
	return { groups };};
