import { error } from '@sveltejs/kit'
import type { PageServerLoad } from "./$types";
import { getGoogleDriveService } from "$lib/services/google-drive-service"

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const driveFiles = await getGoogleDriveService().getHomeFiles();
    const files = driveFiles
      .filter((file): file is { id: string; name: string; mimeType: string } =>
        typeof file.id === 'string' &&
        typeof file.name === 'string' &&
        typeof file.mimeType === 'string'
      );
    return {
      files,
      loginEnabled: locals.featureFlags['Login'] ?? false,
      registerEnabled: locals.featureFlags['Register'] ?? false,
    }
  } catch (_error) {
    console.error(_error);
    error(500);
  }

}
