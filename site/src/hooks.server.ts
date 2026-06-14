import type { Handle } from '@sveltejs/kit';
import { getFeatureFlags } from '$lib/server/feature-flags';

export const handle: Handle = async ({ event, resolve }) => {
	try {
		event.locals.featureFlags = await getFeatureFlags();
	} catch {
		event.locals.featureFlags = {};
	}
	return resolve(event);
};
