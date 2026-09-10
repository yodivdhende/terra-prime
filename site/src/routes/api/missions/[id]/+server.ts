import { isEditMission, missionRepo } from '$lib/db/mission.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
		const missionId = isNumberOrError(params.id);
		const mission = await missionRepo.getWithId(missionId);
		if (mission == null) throw new NotFoundRequest();
		return json(mission);
	});
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), [UserRole.admin]);
		const missionId = isNumberOrError(params.id);
		const mission = await request.json();
		if (isEditMission({ ...mission, id: missionId }) === false) throw new BadRequest();
		await missionRepo.edit({ ...mission, id: missionId });
		return new Response();
	});
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), [UserRole.admin]);
		const missionId = isNumberOrError(params.id);
		await missionRepo.delete(missionId);
		return new Response();
	});
};
