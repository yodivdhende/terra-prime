import { sessionRepo } from '$lib/db/session.repo';
import { RequestError } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { type RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ cookies, params }) => {
    return handleRequest(async () => {
        await authGuard(getSessionToken(cookies), ['admin']);
        const { token } = params;
        if (typeof token !== 'string') throw new RequestError(400, 'need prop token to be a string');
        await sessionRepo.delete(token);
        return new Response();
    });
};
