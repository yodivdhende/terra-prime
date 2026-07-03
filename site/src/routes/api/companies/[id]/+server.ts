import { companyRepo, isCompany } from '$lib/db/companies.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const id = isNumberOrError(params.id);
		const company = await companyRepo.getWithId(id);
		if (company == null) throw new NotFoundRequest();
		return json(company);
	});
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		isNumberOrError(params.id);
		const company = await request.json();
		if (isCompany(company) === false) throw new BadRequest();
		await companyRepo.save(company);
		return new Response();
	});
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const id = isNumberOrError(params.id);
		await companyRepo.delete({ id });
		return new Response();
	});
};
