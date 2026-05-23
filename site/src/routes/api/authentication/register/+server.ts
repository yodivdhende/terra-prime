import { authenticationRepo } from '$lib/db/authentication.repo';
import { sessionRepo } from '$lib/db/session.repo';
import { sendVerificationEmail } from '$lib/server/verification.service';
import { RequestError } from '$lib/types/errors';
import { setSessionToken as setSessionToken } from '$lib/utils/cookies';
import { handleRequest } from '$lib/utils/request';
import { getTommorow } from '$lib/utils/time';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
	return handleRequest(async () => {
		const { email, password, name } = await request.json();
		if (typeof name !== 'string' && typeof email !== 'string' && typeof password !== 'string')
			throw new RequestError(400, 'request needs: name, email and password');
		await authenticationRepo.register({ name, email, password });
		const { userId, roles, name: storedName } = (await authenticationRepo.getCredentials({ email, password })) ?? {};
		if (roles == null || userId == null) throw new RequestError(400, 'credentials wrong');
		const token = await sessionRepo.create({
			userId: userId ?? null,
			roles,
			end: getTommorow(),
			description: 'api login'
		});
		setSessionToken(cookies, token);
		sendVerificationEmail(userId, email).catch((err) => {
			console.error('[register] failed to send verification email:', err);
		});
		return json({userId, roles, name: storedName});
	});
};
