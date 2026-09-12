import { deviceRepo, isEditDevice } from '$lib/db/device.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
		const deviceId = isNumberOrError(params.id);
		const device = await deviceRepo.getWithId(deviceId);
		if (device == null) throw new NotFoundRequest();
		return json(device);
	});
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), [UserRole.admin]);
		const deviceId = isNumberOrError(params.id);
		const device = await request.json();
		if (isEditDevice({ ...device, id: deviceId }) === false) throw new BadRequest();
		const existing = await deviceRepo.getWithId(deviceId);
		if (existing == null) throw new NotFoundRequest();
		const result = await deviceRepo.edit({ ...device, id: deviceId });
		if (result.ok === false) throw new BadRequest('uid is already registered');
		return new Response();
	});
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), [UserRole.admin]);
		const deviceId = isNumberOrError(params.id);
		await deviceRepo.delete(deviceId);
		return new Response();
	});
};
