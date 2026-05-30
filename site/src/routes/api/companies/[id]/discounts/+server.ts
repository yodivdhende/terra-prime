import { companyDiscountsRepo, isCompanyDiscounts } from '$lib/db/company_discounts.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin', 'user']);
		const id = isNumberOrError(params.id);
		return json(await companyDiscountsRepo.getByCompany(id));
	});
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const id = isNumberOrError(params.id);
		const discounts = await request.json();
		if (isCompanyDiscounts(discounts) === false) throw new BadRequest();
		await companyDiscountsRepo.setDiscounts(id, discounts);
		return new Response();
	});
};
