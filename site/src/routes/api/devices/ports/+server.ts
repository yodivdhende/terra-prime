import { deviceRepo } from '$lib/db/device.repo';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

/** Every device holding the Port role — what the Game role's picker is filled from. */
export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
		return json(await deviceRepo.getAllPorts());
	});
};
