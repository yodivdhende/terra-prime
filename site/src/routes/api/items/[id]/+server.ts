import { isItem, itemRepo } from "$lib/db/items.repo";
import { isNumberOrError } from "$lib/request.utils";
import { NotFoundRequest, BadRequest } from "$lib/types/errors";
import { getSessionToken } from "$lib/utils/cookies";
import { handleRequest, authGuardForUser, authGuard } from "$lib/utils/request";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), ['admin']);
        const { id } = params;
		const numberId = isNumberOrError(id);
		const item = await itemRepo.getWithId(numberId);
		if(item == null) throw new NotFoundRequest();
		return json(item);
	});
};

export const DELETE: RequestHandler = async ({ cookies, params}) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const { id } = params;
		const numberId = isNumberOrError(id);
        itemRepo.delete({id: numberId});
		return new Response();
	});
};

export const POST: RequestHandler = async ({cookies, params, request}) => {
	return handleRequest(async ()=> {
		await authGuard(getSessionToken(cookies), ['admin']);
		const {id} = params;
		const numberId = isNumberOrError(id);
		const item = await request.json();
		if(isItem(item) === false) throw new BadRequest();
		await itemRepo.save(item);
		await itemRepo.setCharacterAccess(
			numberId,
			item.characterAccess ?? 'all',
			item.allowedCharacterIds ?? []
		);
		return new Response();
	})
}

