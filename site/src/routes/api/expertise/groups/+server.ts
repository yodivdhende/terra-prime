import { isExpertiseGroup, expertiseRepo } from "$lib/db/expertise.repo";
import { BadRequest } from "$lib/types/errors";
import { getSessionToken } from "$lib/utils/cookies";
import { authGuard, authGuardForUser, handleRequest } from "$lib/utils/request";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), ['admin', 'user']);
		return json(await expertiseRepo.getAllGroups());
	});
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const item = await request.json();
		if (isExpertiseGroup(item) == false) throw new BadRequest();
		expertiseRepo.saveExpertiseGroup(item);
		return new Response();
	});
};
