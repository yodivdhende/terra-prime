import { implantRepo, isImplants as isImplant } from "$lib/db/implants.repo";
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
		const implant = await implantRepo.getWithId(numberId);
		if(implant == null) throw new NotFoundRequest();
		return json(implant);
	});
};

export const DELETE: RequestHandler = async ({ cookies, params}) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const { id } = params;
		const numberId = isNumberOrError(id);
        implantRepo.delete({id: numberId});
		return new Response();
	});
};

export const POST: RequestHandler = async ({cookies, params, request}) => {
	return handleRequest(async ()=> {
		await authGuard(getSessionToken(cookies), ['admin']);
		const {id} = params;
		const numberId = isNumberOrError(id);
		const implant = await request.json();
		if(isImplant(implant) === false) throw new BadRequest();
		await implantRepo.save(implant);
		await implantRepo.setCharacterAccess(
			numberId,
			implant.characterAccess ?? 'all',
			implant.allowedCharacterIds ?? []
		);
		return new Response();
	})
}

