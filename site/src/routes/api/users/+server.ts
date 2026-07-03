import { userRepo } from '$lib/db/user.repo';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		return json(await userRepo.getAll());
	});
};

