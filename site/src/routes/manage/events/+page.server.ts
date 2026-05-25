import type { LarpEvent } from "$lib/db/event.repo";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({fetch}) => {
    const eventsRequest = await fetch('/api/events');
    const events:LarpEvent[]= await eventsRequest.json();
    return {events };
}