import { getGoogleSheetService } from "$lib/services/google-sheet-service";
import { type Actions } from "@sveltejs/kit";

export const actions: Actions = {
    default: async ({ request }) => {
        try {
            const formData = await request.formData();
            const name = formData.get("playtest-name");
            const email = formData.get("playtest-email");
            if(typeof name !== "string") return {error: "input type invalid"}; 
            if(typeof email !== "string") return {error: "input type invalid"}; 
            await getGoogleSheetService().appendPlayTestSheetValues(name, email);
            return {success: true};
        } catch (error){
            console.log(error);
            return {error: 'Something whent wrong please try again later'}
        }
    }
}