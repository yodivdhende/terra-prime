import { UserRole } from "$lib/types/roles";
import { getSessionToken } from "$lib/utils/cookies";
import { authGuardForUser, handleRequest } from "$lib/utils/request";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({cookies}) => {
  return handleRequest(async ()=>{
	await authGuardForUser(getSessionToken(cookies), [UserRole.user]);
  // TODO: Create and return full verions

  return json({});
  })
};