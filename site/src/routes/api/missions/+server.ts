import { isNewMission, missionRepo } from '$lib/db/mission.repo';
import { BadRequest } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
		return json(await missionRepo.getAll());
	});
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), [UserRole.admin]);
		const mission = await request.json();
		if (isNewMission(mission) === false) throw new BadRequest();
		const id = await missionRepo.create(mission);
		if (id == null) throw new BadRequest('could not create mission');
		return json({ id });
	});
};
