import { eventRepo } from '$lib/db/event.repo';
import { eventBudgetRepo } from '$lib/db/event_budget.repo';
import { eventParticipantsRepo } from '$lib/db/event_participants.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
  return handleRequest(async () => {
    await authGuard(getSessionToken(cookies), ['admin', 'user']);
    const eventId = isNumberOrError(params.eventId);
    const characterId = isNumberOrError(params.characterId);
    const [event, characterBudget, extraBudget] = await Promise.all([
      eventRepo.getWithId(eventId),
      eventBudgetRepo.getBudgetForCharacter(eventId, characterId),
      eventParticipantsRepo.getSumPriorRewardBudget({ characterId, excludeEventId: eventId }),
    ]);
    const budget = (event?.budget ?? 0) + characterBudget + extraBudget;
    return json({ budget });
  });
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
  return handleRequest(async () => {
    await authGuard(getSessionToken(cookies), ['admin']);
    const eventId = isNumberOrError(params.eventId);
    const characterId = isNumberOrError(params.characterId);
    const body = await request.json();
    if (typeof body?.budget !== 'number') throw new BadRequest();
    await eventBudgetRepo.setBudget(eventId, characterId, body.budget);
    return new Response();
  });
};
