import { characterRepo } from '$lib/db/character.repo';
import { eventParticipantsRepo } from '$lib/db/event_participants.repo';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';
import { UserRole } from '$lib/types/roles';

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), [UserRole.user]);
		const characters = await characterRepo.getByOwner(userId);
		const ids = characters.map((c) => c.id);
		const eventRows = await eventParticipantsRepo.getEventsForCharacters(ids);

		const result = characters.map((c) => ({
			...c,
			events: eventRows
				.filter((r) => r.characterId === c.id)
				.map((r) => ({ id: r.eventId, name: r.eventName }))
		}));

		return json(result);
	});
};
