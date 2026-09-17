import { eventExtrasRepo } from '$lib/db/event_extras.repo';
import { eventPlayersRepo } from '$lib/db/event_players.repo';

export type EventAttendance = {
	eventId: number;
	userId: number;
	characterVersion: number;
	as: 'player' | 'extra';
};

/**
 * "Is this character at this event, and under which version?" — the question the device lookups
 * and the per-character endpoints ask. Attendance now lives in two tables, so this is the one
 * place that knows to check both; callers take the same shape they used before plus `as`, which
 * they are free to ignore. An NPC at a live event is scannable exactly as a player character is.
 */
export async function findAttendanceForCharacter({
	eventId,
	characterId
}: {
	eventId: number;
	characterId: number;
}): Promise<EventAttendance | undefined> {
	const player = await eventPlayersRepo.getPlayerForCharacter({ eventId, characterId });
	if (player != null) return { ...player, as: 'player' };

	const extra = await eventExtrasRepo.getExtraForCharacter({ eventId, characterId });
	if (extra != null) return { ...extra, as: 'extra' };

	return undefined;
}
