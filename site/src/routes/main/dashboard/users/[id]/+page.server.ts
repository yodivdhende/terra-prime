import { userRepo, type User } from "$lib/db/user.repo";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({params}) =>  {
    try {
        const user = await getUsers(params.id);
        if(user  == null) return error(404, 'Not found!');
        return {
            user: user
        }

    } catch(err) {
        return error(500, `${err}`);
    }

}

async function getUsers(id: any): Promise<User | undefined> {
    if(id == null || typeof id != 'string') return;
    const idNumber = Number(id);
    if(Number.isNaN(idNumber)) return;
    return userRepo.getById({id: idNumber});
}
