import { emailTemplateRepo, isEmailTemplate } from '$lib/db/email_template.repo';
import { BadRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		return json(await emailTemplateRepo.getAll());
	});
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const template = await request.json();
		if (isEmailTemplate(template) === false) throw new BadRequest();
		const id = await emailTemplateRepo.save(template);
		return json({ id });
	});
};
