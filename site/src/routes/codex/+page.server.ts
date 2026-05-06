import { error } from '@sveltejs/kit'
import type { PageServerLoad } from "./$types";
import { getGoogleDriveManager } from "$lib/managers/google-drive-manager.svelte"

export const load: PageServerLoad = async () => {
  try {
    const files = await getGoogleDriveManager().getHomeFiles();
    return { files }
  } catch (_error) {
    console.error(_error);
    error(500);
  }

}
