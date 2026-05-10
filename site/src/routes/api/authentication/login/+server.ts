import { authenticationRepo } from '$lib/db/authentication.repo';
import { sessionRepo } from '$lib/db/session.repo';
import { RequestError, UnAutherizedRequestError } from '$lib/types/errors';
import { setSessionToken } from '$lib/utils/cookies';
import { handleRequest } from '$lib/utils/request';
import { getTommorow } from '$lib/utils/time';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies}) => {
	return handleRequest(async () => {
		const { email, password } = await request.json();
		if (typeof email !== 'string' && typeof password !== 'string') {
			throw new RequestError(400, 'needs email and password');
		}
		const { roles, userId, name } = (await authenticationRepo.getCredentials({ email, password })) ?? {};
		if (roles == null) throw new UnAutherizedRequestError();
		if (userId == null) throw new UnAutherizedRequestError();
		const token = await sessionRepo.create({
			userId,
			roles,
			end: getTommorow(),
			description: `api login ${email}`
		});
		setSessionToken(cookies, token)
		return json({ token, roles, name });
	});
};
