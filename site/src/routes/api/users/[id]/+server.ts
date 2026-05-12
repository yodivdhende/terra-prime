import { isUser, userRepo } from '$lib/db/user.repo';
import { isNumberOrError } from '$lib/request.utils';
import { RequestError } from '$lib/types/errors';
import { handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	return await handleRequest(async () => {
		const { id } = params;
		const numberId = isNumberOrError(id);
		const user = await userRepo.getById({ id: numberId });
		return json(user);
	});
};

export const POST: RequestHandler = async ({ request }) => {
	return handleRequest(async () => {
		const { user } = await request.json();
		if (isUser(user) === false) throw new RequestError(400, 'body was not of type character');
		await userRepo.update(user);
		return new Response();
	});
};
