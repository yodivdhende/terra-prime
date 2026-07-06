import { isExpertiseGroup, expertiseRepo } from "$lib/db/expertise.repo";
import { isNumberOrError } from "$lib/request.utils";
import { BadRequest, NotFoundRequest } from "$lib/types/errors";
import { getSessionToken } from "$lib/utils/cookies";
import { authGuard, authGuardForUser, handleRequest } from "$lib/utils/request";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), ['admin']);
        const { id } = params;
		const numberId = isNumberOrError(id);
		const item = await expertiseRepo.getGroupWithId(numberId);
		if(item == null) throw new NotFoundRequest();
		return json(item);
	});
};

export const DELETE: RequestHandler = async ({ cookies, params}) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const { id } = params;
		const numberId = isNumberOrError(id);
    expertiseRepo.deleteExpertiseGroup(numberId);
		return new Response();
	});
};

export const POST: RequestHandler = async ({cookies, params, request}) => {
	return handleRequest(async ()=> {
		await authGuard(getSessionToken(cookies), ['admin']);
		const {id} = params;
		isNumberOrError(id);
		const item= await request.json();
		if(isExpertiseGroup(item) === false) throw new BadRequest();
		expertiseRepo.saveExpertiseGroup(item);
		return new Response();
	})
}

