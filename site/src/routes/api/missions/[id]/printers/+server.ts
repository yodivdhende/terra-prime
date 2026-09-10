import { missionRepo } from '$lib/db/mission.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

/**
 * Attaching and detaching printers is the only way to change a mission's print
 * availability -- there is no pool field to edit.
 */

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
		const missionId = isNumberOrError(params.id);
		const [mission, allPrinters] = await Promise.all([
			missionRepo.getWithId(missionId),
			missionRepo.getAllPrinters()
		]);
		if (mission == null) throw new NotFoundRequest();
		const attachedIds = new Set(mission.printers.map(({ deviceId }) => deviceId));
		return json({
			attached: mission.printers,
			available: allPrinters.filter(({ deviceId }) => attachedIds.has(deviceId) === false),
			availablePrints: mission.availablePrints
		});
	});
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), [UserRole.admin]);
		const missionId = isNumberOrError(params.id);
		const deviceId = readDeviceId(await request.json());
		const result = await missionRepo.attachPrinter({ missionId, deviceId });
		if (result.ok === false) {
			if (result.reason === 'mission-not-found') throw new NotFoundRequest();
			throw new BadRequest('device is not a printer');
		}
		return json({ availablePrints: await missionRepo.getAvailablePrints(missionId) });
	});
};

export const DELETE: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), [UserRole.admin]);
		const missionId = isNumberOrError(params.id);
		const deviceId = readDeviceId(await request.json());
		await missionRepo.detachPrinter({ missionId, deviceId });
		return json({ availablePrints: await missionRepo.getAvailablePrints(missionId) });
	});
};

function readDeviceId(body: unknown): number {
	if (typeof body !== 'object' || body === null) throw new BadRequest();
	if ('deviceId' in body === false) throw new BadRequest();
	const { deviceId } = body;
	if (typeof deviceId !== 'number' || Number.isInteger(deviceId) === false) throw new BadRequest();
	return deviceId;
}
