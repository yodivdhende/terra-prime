import { implantRepo, isImplants } from "$lib/db/implants.repo";
import { BadRequest } from "$lib/types/errors";
import { UserRole } from "$lib/types/roles";
import { getSessionToken } from "$lib/utils/cookies";
import { handleRequest, authGuardForUser, authGuard } from "$lib/utils/request";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ cookies, url }) => {
	return handleRequest(async () => {
		const { roles } = await authGuardForUser(getSessionToken(cookies), [UserRole.admin, UserRole.user]);
		const isAdmin = roles.includes(UserRole.admin);
		const characterIdParam = url.searchParams.get('characterId');
		if (characterIdParam != null) {
			const characterId = parseInt(characterIdParam, 10);
			if (!isNaN(characterId)) return json(await implantRepo.getAllForCharacter(characterId));
		}
		if (isAdmin) return json(await implantRepo.getAll());
		return json(await implantRepo.getAllAccessibleToAll());
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


