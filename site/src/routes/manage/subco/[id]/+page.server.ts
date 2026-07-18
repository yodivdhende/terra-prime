import { isEnabled } from '$lib/server/feature-flags';
import { redirect } from '@sveltejs/kit';
import { handleRequest } from '$lib/utils/request';
import type { Subco } from '$lib/db/subco.repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params, locals }) => {
	if (!isEnabled(locals.featureFlags, 'Subco')) redirect(302, '/manage');
	return handleRequest(async () => {
		const subco: Subco = await fetch(`/api/subco/${params.id}`).then((r) => r.json());
		return { subco };
	});
};
