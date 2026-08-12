import { redirect } from '@sveltejs/kit';
import { sessionRepo } from '$lib/db/session.repo';
import { isEnabled } from '$lib/server/feature-flags';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url, locals }) => {
	if (url.pathname === '/manage/login' || url.pathname.startsWith('/manage/login/')) {
		return {};
	}

	const token = cookies.get('session-token');
	const credentials = token ? await sessionRepo.getCredentials(token) : null;
	if (credentials == null || !credentials.roles.includes('admin')) {
		redirect(302, '/manage/login');
	}

	return {
		subcoEnabled: isEnabled(locals.featureFlags, 'Subco')
	};
};
