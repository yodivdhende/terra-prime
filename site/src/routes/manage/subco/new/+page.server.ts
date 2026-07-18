import { isEnabled } from '$lib/server/feature-flags';
import { redirect } from '@sveltejs/kit';
import type { User } from '$lib/db/user.repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	if (!isEnabled(locals.featureFlags, 'Subco')) redirect(302, '/manage');
	const allUsers: User[] = await fetch('/api/users').then((r) => r.json());
	return { allUsers };
};
