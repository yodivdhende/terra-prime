import { emailTemplateRepo, isEmailTemplate } from '$lib/db/email_template.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const numberId = isNumberOrError(params.id);
		const template = await emailTemplateRepo.getById(numberId);
		if (template == null) throw new NotFoundRequest();
		return json(template);
	});
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		isNumberOrError(params.id);
		const template = await request.json();
		if (isEmailTemplate(template) === false) throw new BadRequest();
		await emailTemplateRepo.save(template);
		return new Response();
	});
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const numberId = isNumberOrError(params.id);
		await emailTemplateRepo.delete({ id: numberId });
		return new Response();
	});
};
