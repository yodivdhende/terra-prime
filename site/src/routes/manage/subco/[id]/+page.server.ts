import { isEnabled } from '$lib/server/feature-flags';
import { redirect } from '@sveltejs/kit';
import { handleRequest } from '$lib/utils/request';
import type { Subco } from '$lib/db/subco.repo';
import type { User } from '$lib/db/user.repo';
import type { SubcoMemberEntry } from '../../../api/subco/[id]/members/+server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params, locals }) => {
	if (!isEnabled(locals.featureFlags, 'Subco')) redirect(302, '/manage');
	return handleRequest(async () => {
		const [subco, members, allUsers]: [Subco, SubcoMemberEntry[], User[]] = await Promise.all([
			fetch(`/api/subco/${params.id}`).then((r) => r.json()),
			fetch(`/api/subco/${params.id}/members`).then((r) => r.json()),
			fetch('/api/users').then((r) => r.json())
		]);
		return { subco, members, allUsers };
	});
};
