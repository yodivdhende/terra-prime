import { redirect } from '@sveltejs/kit';
import { sessionRepo } from '$lib/db/session.repo';
import { UserRole } from '$lib/types/roles';
import type { PageServerLoad } from './$types';

/**
 * This is a shared walk-up terminal, not a per-player login: any valid session
 * is enough (role `user`, which every account has), not `admin`. The lookup
 * endpoint itself resolves *any* character by name once past this gate — see
 * `$lib/server/games/simon.service.ts` for why that doesn't need admin either.
 */
export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('session-token');
	const credentials = token ? await sessionRepo.getCredentials(token) : null;
	if (credentials == null || !credentials.roles.includes(UserRole.user)) {
		redirect(302, '/manage/login');
	}

	return {};
};
