import type { Implant } from "$lib/db/implants.repo";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({fetch}) => {
    const implantsRequest = await fetch('/api/implants');
    const implants: Implant[]= await implantsRequest.json();
    return {implants };
}