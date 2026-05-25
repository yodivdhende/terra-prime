import type { Handle } from '@sveltejs/kit';
import { getFeatureFlags } from '$lib/server/feature-flags';

export const handle: Handle = async ({ event, resolve }) => {
	try {
		event.locals.featureFlags = await getFeatureFlags();
	} catch (err) {
		console.error('[feature-flags] Failed to load, defaulting all flags to false:', err);
		event.locals.featureFlags = {};
	}

	return resolve(event);
};
