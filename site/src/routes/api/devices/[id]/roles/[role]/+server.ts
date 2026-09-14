import { deviceRepo, parseDeviceRole } from '$lib/db/device.repo';
import { isDeviceRoleName, type DeviceRoleName } from '$lib/types/device';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

/**
 * One endpoint per role table, addressed by name: `/api/devices/12/roles/game`.
 *
 * A device is what its roles say it is, so this — not the device body — is where a device becomes
 * a Port, a Game, a Printer. POST attaches (and re-POSTing edits the role's own fields in place),
 * DELETE detaches. A device that ends up with no roles is unclassified, which is legal.
 */

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), [UserRole.admin]);
		const deviceId = isNumberOrError(params.id);
		const role = readRoleName(params.role);
		// A Port has no fields, so its body may legitimately be absent.
		const body = await readBody(request);
		const parsed = parseDeviceRole(role, body);
		if (parsed == null) throw new BadRequest(`invalid body for the ${role} role`);

		const result = await deviceRepo.attachRole(deviceId, parsed);
		if (result.ok === false) {
			if (result.reason === 'device-not-found') throw new NotFoundRequest();
			if (result.reason === 'character-version-not-found') {
				throw new BadRequest('character version does not exist');
			}
			if (result.reason === 'port-is-self') throw new BadRequest('a game cannot watch itself');
			throw new BadRequest('device is not a port');
		}
		return json(await deviceRepo.getWithId(deviceId));
	});
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), [UserRole.admin]);
		const deviceId = isNumberOrError(params.id);
		const role = readRoleName(params.role);
		const device = await deviceRepo.getWithId(deviceId);
		if (device == null) throw new NotFoundRequest();
		const result = await deviceRepo.detachRole(deviceId, role);
		if (result.ok === false) throw new BadRequest('a game is still watching this port');
		return json(await deviceRepo.getWithId(deviceId));
	});
};

function readRoleName(param: string | undefined): DeviceRoleName {
	if (isDeviceRoleName(param) === false) throw new NotFoundRequest('unknown device role');
	return param;
}

async function readBody(request: Request): Promise<unknown> {
	try {
		return await request.json();
	} catch {
		return {};
	}
}
