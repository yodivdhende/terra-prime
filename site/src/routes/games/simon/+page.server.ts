import type { PageServerLoad } from './$types';
import { getHackingIcon } from '$lib/server/games/simon.service';

export const load: PageServerLoad = async () => {
	return { hackingIcon: await getHackingIcon() };
};
