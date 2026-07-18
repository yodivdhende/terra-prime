import { characterRepo } from '$lib/db/character.repo';
import { subcoRepo } from '$lib/db/subco.repo';
import { BadRequest, NoAccesRequest } from '$lib/types/errors';

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

/**
 * Throw 403 unless the user is the subco's owner (creator). Only the owner
 * may rename a subco; an admin can transfer ownership from the manage page.
 */
export function assertUserIsSubcoOwner(userId: number, subco: { ownerId: number }): void {
	if (subco.ownerId !== userId) {
		throw new NoAccesRequest('only the subco owner can rename it');
	}
}
