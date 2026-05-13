import { implantRepo, isImplants } from "$lib/db/implants.repo";
import { BadRequest } from "$lib/types/errors";
import { UserRole } from "$lib/types/roles";
import { getSessionToken } from "$lib/utils/cookies";
import { handleRequest, authGuardForUser, authGuard } from "$lib/utils/request";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin, UserRole.user]);
		return json(await implantRepo.getAll());
	});
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const implant = await request.json();
		if (isImplants(implant) == false) throw new BadRequest();
		implantRepo.save(implant);
		return new Response();
	});
};


