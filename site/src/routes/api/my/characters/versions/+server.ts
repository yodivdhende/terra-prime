import { characterVersionRepo } from "$lib/db/character_version.repo";
import { UserRole } from "$lib/types/roles";
import { getSessionToken } from "$lib/utils/cookies";
import { authGuardForUser, handleRequest } from "$lib/utils/request";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), [UserRole.user]);
		const versions = await characterVersionRepo.getFullVersionsForUser(userId);
		return json(versions);
	});
};
