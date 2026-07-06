import type { Handle } from '@sveltejs/kit';
import { getFeatureFlags } from '$lib/server/feature-flags';
import { sessionRepo } from '$lib/db/session.repo';

const SKIP_PREFIXES = ['/promo', '/manage', '/info', '/api'];

export const handle: Handle = async ({ event, resolve }) => {
	try {
		event.locals.featureFlags = await getFeatureFlags();
	} catch {
		event.locals.featureFlags = {};
	}

	const path = event.url.pathname;
	const isSkipped = path === '/' || SKIP_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
	if (!isSkipped) {
		const token = event.cookies.get('session-token');
		if (token) {
			const session = await sessionRepo.getCredentials(token);
			if (!session) {
				event.cookies.delete('session-token', { path: '/' });
			}
		}
	}

	return resolve(event);
};
