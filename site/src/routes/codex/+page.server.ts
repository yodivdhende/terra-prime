import { error } from '@sveltejs/kit'
import type { PageServerLoad } from "./$types";
import { getGoogleDriveService } from "$lib/services/google-drive-service"

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const files = await getGoogleDriveService().getHomeFiles();
    return {
      files,
      loginEnabled: locals.featureFlags['Login'] ?? false,
    }
  } catch (_error) {
    console.error(_error);
    error(500);
  }

}
