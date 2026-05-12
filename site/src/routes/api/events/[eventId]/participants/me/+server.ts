import { eventParticipantsRepo } from '$lib/db/event_participants.repo';
import { isNumberOrError } from '$lib/request.utils';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), [UserRole.user]);
		const eventId = isNumberOrError(params.eventId);
		const participation = await eventParticipantsRepo.getUserParticipation({ eventId, userId });
		if (!participation) return new Response(null, { status: 204 });
		return json(participation);
	});
};
