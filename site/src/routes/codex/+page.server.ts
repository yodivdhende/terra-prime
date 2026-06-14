import type { PageServerLoad } from './$types';
import { getGoogleDriveService } from '$lib/services/google-drive-service';

export const load: PageServerLoad = async ({ locals }) => {
	const files = await getGoogleDriveService().getHomeFiles();
	return {
		files: files.map(f => ({ id: f.id!, name: f.name!, mimeType: f.mimeType! })),
		loginEnabled: locals.featureFlags['Login'] ?? false,
		registerEnabled: locals.featureFlags['Register'] ?? false,
	};
};
