import { characterVersionRepo } from "$lib/db/character_version.repo";
import { findAttendanceForCharacter } from "$lib/server/event-attendance.service";
import { isNumberOrError } from "$lib/request.utils";
import { UserRole } from "$lib/types/roles";
import { getSessionToken } from "$lib/utils/cookies";
import { authGuardForUser, handleRequest } from "$lib/utils/request";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({cookies, params}) => {
  return handleRequest(async ()=>{
    await authGuardForUser(getSessionToken(cookies), [UserRole.user]);
    const characterId = isNumberOrError(params.characterId);
    const eventId = isNumberOrError(params.eventId);

    const attendance = await findAttendanceForCharacter({eventId, characterId});
    if(attendance?.characterVersion == null) return json({ characterVersion: undefined });

    const characterVersion = await characterVersionRepo.getWithId(attendance.characterVersion);
    return json({ characterVersion });
  })
}
