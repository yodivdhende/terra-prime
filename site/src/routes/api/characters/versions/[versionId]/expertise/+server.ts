import { characterVersionRepo, isCharacterVersionExpertise } from "$lib/db/character_version.repo";
import { isNumberOrError } from "$lib/request.utils";
import { BadRequest } from "$lib/types/errors";
import { getSessionToken } from "$lib/utils/cookies";
import { authGuard, handleRequest } from "$lib/utils/request";
import type { RequestHandler } from "@sveltejs/kit";

export const PUT: RequestHandler = async ({cookies, request, params}) => {
  return handleRequest(async ()=>{
		await authGuard(getSessionToken(cookies), ['user']);
    const versionId = isNumberOrError(params.versionId);
    const body = await request.json();
    if(Array.isArray(body) === false) throw new BadRequest();
    if(body.every(isCharacterVersionExpertise) === false) throw new BadRequest();
    await characterVersionRepo.saveExpertise({versionId, expertise: body});
    return new Response();
  })
}
