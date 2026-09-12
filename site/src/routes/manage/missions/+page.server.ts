import type { Mission } from '$lib/db/mission.repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const response = await fetch('/api/missions');
	const missions: Mission[] = response.ok ? await response.json() : [];
	return { missions };
};
