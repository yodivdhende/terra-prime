import { characterVersionRepo, isCharacterVersionBare } from "$lib/db/character_version.repo";
import { BadRequest } from "$lib/types/errors";
import { UserRole } from "$lib/types/roles";
import { getSessionToken } from "$lib/utils/cookies";
import { authGuardForUser, handleRequest } from "$lib/utils/request";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ cookies }) => {
  return handleRequest(async () => {
    await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
    const versions = await characterVersionRepo.getAllWithCharacterName();
    return json(versions);
  });
};

export const PUT: RequestHandler = async ({cookies, request}) => {
  return handleRequest(async ()=>{
		await authGuardForUser(getSessionToken(cookies), [UserRole.user]);
    const characterVersion = await request.json();
    if(!isCharacterVersionBare(characterVersion)) throw new BadRequest();
    const id = await characterVersionRepo.save(characterVersion);
    return json({ id });
  });
}