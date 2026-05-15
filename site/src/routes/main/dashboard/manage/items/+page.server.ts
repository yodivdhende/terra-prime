import type { Item } from "$lib/db/items.repo";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({fetch}) => {
    const itemsRequest = await fetch('/api/items');
    const items: Item[]= await itemsRequest.json();
    return {items };
}