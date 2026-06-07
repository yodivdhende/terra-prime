import type { Implant } from '$lib/db/implants.repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const allImplants: Implant[] = await fetch('/api/implants').then((r) => r.json());
	return { allImplants };
};
