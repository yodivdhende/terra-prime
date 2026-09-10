import { missionRepo } from '$lib/db/mission.repo';
import { isNumberOrError } from '$lib/request.utils';
import { NotFoundRequest } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), [UserRole.admin]);
		const missionId = isNumberOrError(params.id);
		const closed = await missionRepo.closeMission(missionId);
		if (closed === false) throw new NotFoundRequest();
		return new Response();
	});
};
