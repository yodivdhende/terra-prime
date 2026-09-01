import type { ExpertisePointCost } from '$lib/db/expertise_point_costs.repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const pointCostsRequest = await fetch('/api/expertise/point-costs');
	const pointCosts: ExpertisePointCost[] = await pointCostsRequest.json();
	return { pointCosts };
};
