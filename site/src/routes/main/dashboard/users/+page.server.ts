import {error} from '@sveltejs/kit'
import { userRepo } from "$lib/db/user.repo";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    try {
        return {
            users: await userRepo.getAll(),
        }
    } catch(err) {
       error(500);
    }

}