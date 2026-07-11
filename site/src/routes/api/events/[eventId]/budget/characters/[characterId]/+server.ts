import { characterRepo } from '$lib/db/character.repo';
import { getAvailableBudget } from '$lib/server/budget.service';
import { isNumberOrError } from '$lib/request.utils';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
  return handleRequest(async () => {
    await authGuard(getSessionToken(cookies), ['admin', 'user']);
    const eventId = isNumberOrError(params.eventId);
    const characterId = isNumberOrError(params.characterId);
    const character = await characterRepo.getById(characterId);
    const budget = await getAvailableBudget({ eventId, characterId, ownerId: character.ownerId });
    return json({ budget });
  });
};
