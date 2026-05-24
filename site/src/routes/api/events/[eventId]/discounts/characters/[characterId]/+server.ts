import { eventDiscountsRepo, isCharacterDiscountsBody } from '$lib/db/event_discounts.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const eventId = isNumberOrError(params.eventId);
		const characterId = isNumberOrError(params.characterId);
		return json(await eventDiscountsRepo.getByEventAndCharacter(eventId, characterId));
	});
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const eventId = isNumberOrError(params.eventId);
		const characterId = isNumberOrError(params.characterId);
		const discounts = await request.json();
		if (isCharacterDiscountsBody(discounts) === false) throw new BadRequest();
		await eventDiscountsRepo.setDiscounts(eventId, characterId, discounts);
		return new Response();
	});
};
