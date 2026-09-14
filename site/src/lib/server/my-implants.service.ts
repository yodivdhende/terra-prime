import { characterVersionRepo } from '$lib/db/character_version.repo';
import { implantRepo } from '$lib/db/implants.repo';
import type { VersionImplant } from '../../routes/api/my/characters/versions/+server';

/**
 * One character version's fitted implants, catalog entries and charge counts joined.
 *
 * Read straight from the instance rows rather than from a loaded `CharacterVersionBare`, because
 * that shape collapses an implant fitted in two slots into one entry — fine for a loadout, wrong
 * for charges, where each fitted copy is its own stock. Rows come back in slot order, which is the
 * order the handheld's Implants screen draws and the order `spendCharge` drains.
 *
 * Shared by the read (`GET /api/my/implants`) and the activation that follows it, so the count a
 * device is handed after spending a charge is built the same way as the one it was showing.
 */
export async function myImplants(characterVersionId: number): Promise<VersionImplant[]> {
	const fitted = await characterVersionRepo.getImplantsforCharacterVersions([characterVersionId]);
	if (fitted.length === 0) return [];

	const catalog = await implantRepo.getWithIds([...new Set(fitted.map((f) => f.implantId))]);
	const byId = new Map(catalog.flatMap((i) => (i.id == null ? [] : [[i.id, i] as const])));

	return fitted
		.flatMap((entry): VersionImplant[] => {
			const catalogEntry = byId.get(entry.implantId);
			if (catalogEntry == null) return [];
			return [
				{
					id: entry.implantId,
					name: catalogEntry.name,
					description: catalogEntry.description,
					slot: entry.slot,
					maxCharges: catalogEntry.maxCharges ?? 0,
					chargesRemaining: entry.chargesRemaining
				}
			];
		})
		.sort((a, b) => a.slot - b.slot || a.name.localeCompare(b.name));
}
