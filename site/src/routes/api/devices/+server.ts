import { deviceRepo, isNewDevice } from '$lib/db/device.repo';
import { BadRequest } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
		return json(await deviceRepo.getAll());
	});
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), [UserRole.admin]);
		const device = await request.json();
		if (isNewDevice(device) === false) throw new BadRequest();
		const result = await deviceRepo.create(device);
		if (result.ok === false) throw new BadRequest('uid is already registered');
		return json({ id: result.id });
	});
};
