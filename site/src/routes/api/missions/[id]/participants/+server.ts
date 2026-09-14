import { missionRepo } from '$lib/db/mission.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest, NotFoundRequest, RequestError } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

/**
 * How a player ends up on a mission roster is still an open design question --
 * there is no `register_mission` UID scan any more, and a Port carries no
 * behaviour of its own. Until whatever subscribes to the docking events answers
 * it, an admin registers a character version here; `registerParticipant` holds
 * the limit and status checks either way.
 */

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
		const missionId = isNumberOrError(params.id);
		const mission = await missionRepo.getWithId(missionId);
		if (mission == null) throw new NotFoundRequest();
		return json(mission.participants);
	});
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), [UserRole.admin]);
		const missionId = isNumberOrError(params.id);
		const characterVersionId = readCharacterVersionId(await request.json());
		const result = await missionRepo.registerParticipant({ missionId, characterVersionId });
		if (result.ok === false) {
			if (result.reason === 'mission-not-found') throw new NotFoundRequest();
			if (result.reason === 'mission-closed') throw new RequestError(409, 'mission is closed');
			throw new RequestError(409, 'mission is full');
		}
		return json({ alreadyRegistered: result.alreadyRegistered });
	});
};

export const DELETE: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), [UserRole.admin]);
		const missionId = isNumberOrError(params.id);
		const characterVersionId = readCharacterVersionId(await request.json());
		await missionRepo.unregisterParticipant({ missionId, characterVersionId });
		return new Response();
	});
};

function readCharacterVersionId(body: unknown): number {
	if (typeof body !== 'object' || body === null) throw new BadRequest();
	if ('characterVersionId' in body === false) throw new BadRequest();
	const { characterVersionId } = body;
	if (typeof characterVersionId !== 'number' || Number.isInteger(characterVersionId) === false)
		throw new BadRequest();
	return characterVersionId;
}
