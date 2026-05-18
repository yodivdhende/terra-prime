import { isUser, userRepo } from '$lib/db/user.repo';
import { isNumberOrError } from '$lib/request.utils';
import { RequestError } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
    return await handleRequest(async () => {
        await authGuard(getSessionToken(cookies), ['admin']);
        const { id } = params;
        const numberId = isNumberOrError(id);
        const user = await userRepo.getById({ id: numberId });
        return json(user);
    });
};

export const POST: RequestHandler = async ({ cookies, request }) => {
    return handleRequest(async () => {
        await authGuard(getSessionToken(cookies), ['admin']);
        const user = await request.json();
        if (isUser(user) === false) throw new RequestError(400, 'body was not of type user');
        await userRepo.update(user);
        return new Response();
    });
};
