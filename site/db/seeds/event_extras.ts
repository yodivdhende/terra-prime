import type { eventExtras } from '../../src/lib/db/schema';

export const rows: (typeof eventExtras.$inferInsert)[] = [
	// One extra holding both NPC versions at event 1 …
	{ id: 1, eventId: 1, userId: 3, characterVersionId: 6 },
	{ id: 2, eventId: 1, userId: 3, characterVersionId: 7 },
	// … and one enrolled with nothing assigned yet.
	{ id: 3, eventId: 1, userId: 4, characterVersionId: null }
];
