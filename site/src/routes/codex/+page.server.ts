import type { PageServerLoad } from './$types';
import { getGoogleDriveService } from '$lib/services/google-drive-service';

export const load: PageServerLoad = async ({ locals }) => {
	let files: { id: string; name: string; mimeType: string }[] = [];
	try {
		const driveFiles = await getGoogleDriveService().getHomeFiles();
		files = driveFiles.map(f => ({ id: f.id!, name: f.name!, mimeType: f.mimeType! }));
	} catch (err) {
		console.error('[codex] Failed to load Google Drive files:', err);
	}
	return {
		files,
		loginEnabled: locals.featureFlags['Login'] ?? false,
		registerEnabled: locals.featureFlags['Register'] ?? false,
		backstoryEnabled: locals.featureFlags['Backstory'] ?? false,
		couponsEnabled: locals.featureFlags['Coupons'] ?? false,
	};
};
