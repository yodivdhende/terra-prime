import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		flags: locals.featureFlags,
		loginEnabled: locals.featureFlags['Login'] ?? false,
	};
};
