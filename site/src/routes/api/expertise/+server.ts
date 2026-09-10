import { isExpertise, expertiseRepo } from "$lib/db/expertise.repo";
import { BadRequest } from "$lib/types/errors";
import { getSessionToken } from "$lib/utils/cookies";
import { authGuard, authGuardForUser, handleRequest } from "$lib/utils/request";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ cookies, url }) => {
	return handleRequest(async () => {
		const { roles } = await authGuardForUser(getSessionToken(cookies), ['admin', 'user']);
		const isAdmin = roles.includes('admin');
		const characterIdParam = url.searchParams.get('characterId');
		if (characterIdParam != null) {
			const characterId = parseInt(characterIdParam, 10);
			if (!isNaN(characterId)) return json(await expertiseRepo.getAllForCharacter(characterId));
		}
		if (isAdmin) return json(await expertiseRepo.getAll());
		return json(await expertiseRepo.getAllAccessibleToAll());
	});
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const item = await request.json();
		if (isExpertise(item) == false) throw new BadRequest();
		expertiseRepo.save(item);
		return new Response();
	});
};
