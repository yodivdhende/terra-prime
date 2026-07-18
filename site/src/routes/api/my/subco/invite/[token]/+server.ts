import { characterRepo } from '$lib/db/character.repo';
import { subcoInviteRepo } from '$lib/db/subco_invite.repo';
import { subcoRepo } from '$lib/db/subco.repo';
import { userRepo } from '$lib/db/user.repo';
import { BadRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), ['user']);
		const { email } = await userRepo.getById({ id: userId });

		const invite = await subcoInviteRepo.getByToken({ token: params.token! });
		if (invite.status !== 'invited') throw new BadRequest('invite is no longer valid');
		if (invite.email.toLowerCase() !== email.toLowerCase())
			throw new BadRequest('this invite does not belong to you');

		const body = await request.json();
		const characterId = body?.characterId;
		if (typeof characterId !== 'number' || isNaN(characterId)) throw new BadRequest();

		const owned = await characterRepo.getByOwner(userId);
		if (owned.some((c) => c.id === characterId) === false)
			throw new BadRequest('character does not belong to you');

		const subco = await subcoRepo.getWithId(invite.subcoId);
		if (subco == null) throw new BadRequest('subco not found');
		if (subco.members.includes(characterId) === false) {
			await subcoRepo.save({ ...subco, members: [...subco.members, characterId] });
		}

		await subcoInviteRepo.setStatus({ token: params.token!, status: 'accepted' });
		return new Response();
	});
};
