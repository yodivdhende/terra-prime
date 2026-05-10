import { error } from '@sveltejs/kit'
import type { PageServerLoad } from "./$types";
import { getGoogleDriveManager } from "$lib/managers/google-drive-manager.svelte"

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const files = await getGoogleDriveManager().getHomeFiles();
    return {
      files,
      loginEnabled: locals.featureFlags['Login'] ?? false,
    }
  } catch (_error) {
    console.error(_error);
    error(500);
  }

}
