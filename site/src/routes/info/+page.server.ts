import { getGoogleSheetManager } from "$lib/managers/google-sheet-manager.svelte";
import { json } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    const playTestSheetValues= await getGoogleSheetManager().getPlayTestSheetValues();
    return {
        values: playTestSheetValues,
    }
}