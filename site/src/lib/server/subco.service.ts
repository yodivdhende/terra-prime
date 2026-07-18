import { characterVersionRepo } from '$lib/db/character_version.repo';
import { characterRepo } from '$lib/db/character.repo';
import { subcoRepo } from '$lib/db/subco.repo';
import { BadRequest, NoAccesRequest } from '$lib/types/errors';

/**
 * A subco has exactly one company; every version of a member character must use
 * that company. When saving a character version, if the character belongs to a
 * subco the version's company must match the subco's company.
 */
export async function assertVersionCompanyMatchesSubco(version: {
	characterId: number;
	company: number;
}): Promise<void> {
	const subco = await subcoRepo.getForCharacter({ characterId: version.characterId });
	if (subco == null) return;
	if (subco.company !== version.company) {
		throw new BadRequest(
			`character version company (${version.company}) does not match its subco company (${subco.company})`
		);
	}
}

/**
 * When adding characters to a subco, every existing version of each member must
 * already use the subco's company — otherwise the subco's single-company rule
 * would be violated.
 */
export async function assertCharactersMatchCompany({
	company,
	members
}: {
	company: number;
	members: number[];
}): Promise<void> {
	for (const characterId of members) {
		const versions = await characterVersionRepo.getForCharacter(characterId);
		const mismatch = versions.find((version) => version.company !== company);
		if (mismatch) {
			throw new BadRequest(
				`character ${characterId} has a version using company ${mismatch.company}, which does not match the subco company ${company}`
			);
		}
	}
}

/**
 * A player may only touch a subco that contains a character they own. Returns
 * whether the given member list contains at least one of the user's characters.
 */
export async function userOwnsSubcoMember(userId: number, members: number[]): Promise<boolean> {
	const owned = await characterRepo.getByOwner(userId);
	const ownedIds = new Set(owned.map((character) => character.id));
	return members.some((member) => ownedIds.has(member));
}

/**
 * Throw 403 unless the user owns a character in the stored subco. Used to guard
 * player edits of an existing subco.
 */
export async function assertUserBelongsToSubco(userId: number, subcoId: number): Promise<void> {
	const subco = await subcoRepo.getWithId(subcoId);
	if (subco == null || (await userOwnsSubcoMember(userId, subco.members)) === false) {
		throw new NoAccesRequest('subco does not belong to you');
	}
}
