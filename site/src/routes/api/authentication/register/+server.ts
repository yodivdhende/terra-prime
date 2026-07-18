import { authenticationRepo } from '$lib/db/authentication.repo';
import { sessionRepo } from '$lib/db/session.repo';
import { subcoInviteRepo } from '$lib/db/subco_invite.repo';
import { sendVerificationEmail } from '$lib/server/verification.service';
import { joinSubcoForUser } from '$lib/server/subco-invite.service';
import { RequestError } from '$lib/types/errors';
import { setSessionToken as setSessionToken } from '$lib/utils/cookies';
import { handleRequest } from '$lib/utils/request';
import { getTommorow } from '$lib/utils/time';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	return handleRequest(async () => {
		if (!locals.featureFlags['Register']) throw new RequestError(403, 'registration is disabled');
		const { email, password, name, invite } = await request.json();
		if (typeof name !== 'string' && typeof email !== 'string' && typeof password !== 'string')
			throw new RequestError(400, 'request needs: name, email and password');
		await authenticationRepo.register({ name, email, password });
		const {
			userId,
			roles,
			name: storedName
		} = (await authenticationRepo.getCredentials({ email, password })) ?? {};
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
		if (typeof invite === 'string' && invite.trim().length > 0) {
			try {
				const { subcoId } = await subcoInviteRepo.consumeToken(invite.trim());
				await joinSubcoForUser(subcoId, userId);
			} catch (err) {
				console.error('[register] failed to consume subco invite:', err);
			}
		}
		return json({ userId, roles, name: storedName });
	});
};
