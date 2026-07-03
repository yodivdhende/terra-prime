import { eventBudgetRepo } from '$lib/db/event_budget.repo';
import { isNumberOrError } from '$lib/request.utils';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const eventId = isNumberOrError(params.eventId);
		return json(await eventBudgetRepo.getAllByEvent(eventId));
	});
};
