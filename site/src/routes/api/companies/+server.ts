import { companyRepo, isCompany } from '$lib/db/companies.repo';
import { BadRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), ['admin', 'user']);
		return json(await companyRepo.getAll());
	});
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const company = await request.json();
		if (isCompany(company) === false) throw new BadRequest();
		await companyRepo.save(company);
		return new Response();
	});
};
