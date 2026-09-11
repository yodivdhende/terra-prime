import type { eventParticipants } from '../../src/lib/db/schema';

export const rows: (typeof eventParticipants.$inferInsert)[] = [
	{ eventId: 1, userId: 1, characterVersionId: 1 },
	{ eventId: 1, userId: 2, characterVersionId: 5 },
	{ eventId: 1, userId: 5, characterVersionId: null },
	{ eventId: 1, userId: 6, characterVersionId: null },
	{ eventId: 2, userId: 2, characterVersionId: 2 },
	{ eventId: 1, userId: 7, characterVersionId: null }
];
