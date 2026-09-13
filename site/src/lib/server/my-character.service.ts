import { characterRepo } from '$lib/db/character.repo';
import { characterVersionRepo, type CharacterVersionBare } from '$lib/db/character_version.repo';
import { deviceRepo } from '$lib/db/device.repo';
import { NoAccesRequest, NotFoundRequest, UnAutherizedRequestError } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { setPotentialSessionToken } from '$lib/utils/cookies';
import { authGuardForUser } from '$lib/utils/request';
import type { Cookies } from '@sveltejs/kit';

/**
 * Resolving "my character version" for the `/api/my/**` read paths.
 *
 * Two kinds of caller ask for their own character version, and they identify themselves
 * differently:
 *
 * - a **player** in a browser, by the `session-token` cookie. A player may own several characters
 *   and each several versions, so `?characterVersionId=` picks one and the newest owned version is
 *   the default.
 * - an **AguesGuard**, by the UID it is registered under in `Devices`. It asserts nothing about
 *   which character it is showing: the server reads that from the device's `aguesguard` role, so
 *   the prop never carries a player's session token on its SD card. Re-binding a handheld to
 *   another character version is an admin edit of that role, with nothing to reflash.
 *
 * The device header wins when both are present, so an admin's own browser session cannot shadow
 * the handheld they are provisioning from the same machine.
 *
 * A UID is a bearer credential sent in the clear, and whoever can read one can replay it. That is
 * the same self-asserted device identity the WebSocket channel already has; closing it needs a
 * per-device secret on `Devices`, which is deliberately not done here.
 */
export const DEVICE_UID_HEADER = 'x-device-uid';

export type MyCharacterVersion = {
	characterId: number;
	characterName: string;
	versionId: number;
	versionName: string;
	version: CharacterVersionBare;
	/** How the caller was identified. For route-level policy and logging, not for the wire. */
	via: 'session' | 'device';
};

type MyCharacterRequest = {
	cookies: Cookies;
	request: Request;
	url: URL;
};

export async function resolveMyCharacterVersion({
	cookies,
	request,
	url
}: MyCharacterRequest): Promise<MyCharacterVersion> {
	const deviceUid = request.headers.get(DEVICE_UID_HEADER)?.trim();
	if (deviceUid) return resolveForDevice(deviceUid);
	return resolveForSession(cookies, url);
}

/** The AguesGuard path: the UID names the device, the device's role names the character version. */
async function resolveForDevice(uid: string): Promise<MyCharacterVersion> {
	const device = await deviceRepo.getWithUid(uid);
	if (device == null) throw new UnAutherizedRequestError('unknown device uid');
	const role = device.roles.find((r) => r.role === 'aguesguard');
	if (role == null) throw new NoAccesRequest('device is not an AguesGuard');
	const version = await characterVersionRepo.getWithId(role.characterVersionId);
	if (version?.id == null) {
		throw new NotFoundRequest('the character version bound to this device no longer exists');
	}
	return withCharacter(version, version.id, 'device');
}

/**
 * The player path. `?characterVersionId=` must name a version the caller owns; without it the
 * newest owned version is used, which is the one a player has just been building.
 */
async function resolveForSession(cookies: Cookies, url: URL): Promise<MyCharacterVersion> {
	const token = setPotentialSessionToken(cookies);
	if (token == null) throw new UnAutherizedRequestError();
	const { userId } = await authGuardForUser(token, [UserRole.user]);

	const owned = (await characterVersionRepo.getForUser(userId)).filter((v) => v.id != null);
	if (owned.length === 0) throw new NotFoundRequest('no character version for this user');

	const requested = url.searchParams.get('characterVersionId');
	if (requested == null) {
		const newest = owned.reduce((a, b) => ((b.id as number) > (a.id as number) ? b : a));
		return withCharacter(newest, newest.id as number, 'session');
	}

	const version = owned.find((v) => v.id === Number(requested));
	// Not a 403: a version the caller does not own is indistinguishable from one that does not
	// exist, and answering differently would say which ids are taken.
	if (version == null) throw new NotFoundRequest('no such character version for this user');
	return withCharacter(version, version.id as number, 'session');
}

async function withCharacter(
	version: CharacterVersionBare,
	versionId: number,
	via: MyCharacterVersion['via']
): Promise<MyCharacterVersion> {
	const character = await characterRepo.getById(version.characterId);
	return {
		characterId: character.id,
		characterName: character.name,
		versionId,
		versionName: version.name,
		version,
		via
	};
}
