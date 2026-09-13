import { characterVersionRepo } from '$lib/db/character_version.repo';
import { isNumberOrError } from '$lib/request.utils';
import { NotFoundRequest } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

/**
 * Recharge every implant a character version carries.
 *
 * Refreshing is deliberately the one half of the charge cycle a player cannot reach: the device
 * spends charges through `/api/my/implants/[id]/activate`, and only an admin at the control-room
 * desk puts them back. Nothing about the body decides how much is restored — the catalog's
 * `MaxCharges` does — so this endpoint takes no body at all and cannot be used to invent charges.
 */
export const POST: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
		const versionId = isNumberOrError(params.versionId);

		const version = await characterVersionRepo.getWithId(versionId);
		if (version == null) throw new NotFoundRequest('no such character version');

		const refreshed = await characterVersionRepo.refreshCharges(versionId);
		return json({ refreshed });
	});
};
