import { characterVersionRepo } from '$lib/db/character_version.repo';
import { deviceRepo } from '$lib/db/device.repo';
import { getRealtimeBridge } from '$lib/realtime/registry';
import { isNumberOrError } from '$lib/request.utils';
import { resolveMyCharacterVersion } from '$lib/server/my-character.service';
import { myImplants } from '$lib/server/my-implants.service';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import { handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';
import type { VersionImplant } from '../../../characters/versions/+server';

/**
 * A player activates one charge of an implant they carry — the device-side half of the charge
 * cycle whose other half is the admin refresh at
 * `POST /api/characters/versions/[versionId]/implants/refresh`.
 *
 * `[id]` is the **catalog** implant id, the one `GET /api/my/implants` lists, because that is the
 * only id the handheld is ever given; the caller's own character version is resolved the same way
 * every `/api/my/**` route resolves it, and the spend is scoped to it in a single statement. So
 * there is no implant id a caller can name that reaches someone else's body, and an implant the
 * caller does not carry answers 404 rather than saying whether it exists.
 *
 * Spending is not idempotent, which is the point — but running out is not an error either: a
 * second press on an empty implant answers 200 with `spent: false`, so a prop that fires twice on
 * one touch does not paint an error over the screen.
 */
export type ActivateImplantResponse = {
	/** False when the implant was already at zero. The count below is authoritative either way. */
	spent: boolean;
	implant: VersionImplant;
	/** The whole list, so a screen can redraw from one response instead of re-fetching. */
	implants: VersionImplant[];
};

export const POST: RequestHandler = async ({ cookies, params, request, url }) => {
	return handleRequest(async () => {
		const { versionId } = await resolveMyCharacterVersion({ cookies, request, url });
		const implantId = isNumberOrError(params.id);

		const result = await characterVersionRepo.spendCharge({
			characterVersionId: versionId,
			implantId
		});
		if (result == null) throw new NotFoundRequest('no such implant on this character');

		const implants = await myImplants(versionId);
		const implant = implants.find((entry) => entry.id === implantId);
		// The implant is fitted — `spendCharge` just said so — so a miss here means its catalog row
		// is gone underneath the instance, which is a broken loadout rather than a bad request.
		if (implant == null) throw new BadRequest('implant is fitted but missing from the catalog');

		await notifyBoundDevices(versionId);

		const response: ActivateImplantResponse = { spent: result.spent, implant, implants };
		return json(response);
	});
};

/**
 * Tell every AguesGuard showing this character to redraw its Implants screen.
 *
 * The screen refills itself from `/api/my/implants` whenever it loads, so the push carries no
 * counts of its own — pointing the device at the screen is enough, and it means a handheld that
 * was not the one activating (a spare bound to the same version) ends up current too.
 *
 * Best-effort by design: the bridge is absent under `vite dev` and the broker can be down, and
 * neither is a reason to fail a charge that is already spent. The database is the record; the
 * push is a courtesy, and the device re-reads on its next screen load regardless.
 */
async function notifyBoundDevices(characterVersionId: number): Promise<void> {
	const bridge = getRealtimeBridge();
	if (bridge === null) return;
	try {
		const bound = await deviceRepo.getAguesGuardsForCharacterVersion(characterVersionId);
		await Promise.all(
			bound.map((device) =>
				bridge.publishDeviceCommand(device.uid, { kind: 'cyd.show', screen: 'implants' })
			)
		);
	} catch (err) {
		console.error('could not push the implant charge update to the bound devices', err);
	}
}
