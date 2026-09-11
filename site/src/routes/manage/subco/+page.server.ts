import { isEnabled } from '$lib/server/feature-flags';
import { redirect } from '@sveltejs/kit';
import type { Subco } from '$lib/db/subco.repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	if (!isEnabled(locals.featureFlags, 'Subco')) redirect(302, '/manage');
	const response = await fetch('/api/subco');
	const subcos: Subco[] = await response.json();
	return { subcos };
};
