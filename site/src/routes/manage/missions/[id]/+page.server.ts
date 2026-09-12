import type { Mission } from '$lib/db/mission.repo';
import { handleRequest } from '$lib/utils/request';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	return handleRequest(async () => {
		const response = await fetch(`/api/missions/${params.id}`);
		const mission: Mission | undefined = response.ok ? await response.json() : undefined;
		return { mission };
	});
};
