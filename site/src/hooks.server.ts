import type { Handle } from '@sveltejs/kit';
import { getGoogleSheetManager } from '$lib/managers/google-sheet-manager.svelte';

export const handle: Handle = async ({ event, resolve }) => {
	try {
		event.locals.featureFlags = await getGoogleSheetManager().getFeatureFlags();
	} catch {
		event.locals.featureFlags = {};
	}
	return resolve(event);
};
