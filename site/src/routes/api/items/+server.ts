import { isItem, itemRepo } from "$lib/db/items.repo";
import { BadRequest } from "$lib/types/errors";
import { getSessionToken } from "$lib/utils/cookies";
import { handleRequest, authGuardForUser, authGuard } from "$lib/utils/request";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ cookies, url }) => {
	return handleRequest(async () => {
		const { roles } = await authGuardForUser(getSessionToken(cookies), ['admin', 'user']);
		const isAdmin = roles.includes('admin');
		const characterIdParam = url.searchParams.get('characterId');
		if (characterIdParam != null) {
			const characterId = parseInt(characterIdParam, 10);
			if (!isNaN(characterId)) return json(await itemRepo.getAllForCharacter(characterId));
		}
		if (isAdmin) return json(await itemRepo.getAll());
		return json(await itemRepo.getAllAccessibleToAll());
	});
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const item = await request.json();
		if (isItem(item) == false) throw new BadRequest();
		itemRepo.save(item);
		return new Response();
	});
};


