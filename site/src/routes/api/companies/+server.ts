import { companyRepo } from '$lib/db/companies.repo';
import { getSessionToken } from '$lib/utils/cookies';
import { handleRequest, authGuardForUser } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), ['admin', 'user']);
		return json(await companyRepo.getAll());
	});
};
