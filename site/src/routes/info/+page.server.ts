import { getGoogleSheetManager } from "$lib/managers/google-sheet-manager.svelte";
import { type Actions } from "@sveltejs/kit";

export const actions: Actions = {
    default: async ({ request }) => {
        const formData = await request.formData();
        const name = formData.get("playtest-name");
        const email = formData.get("playtest-email");
        if(typeof name !== "string") return {error: "input type invalid"}; 
        if(typeof email !== "string") return {error: "input type invalid"}; 
        getGoogleSheetManager().appendPlayTestSheetValues(name, email);
        return {success: true};
    }
}