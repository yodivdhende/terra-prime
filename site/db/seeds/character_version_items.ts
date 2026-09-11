import type { characterVersionItems } from '../../src/lib/db/schema';

export const rows: (typeof characterVersionItems.$inferInsert)[] = [
	{ id: 1, characterVersionId: 1, itemId: 1, count: 1 },
	{ id: 2, characterVersionId: 1, itemId: 2, count: 2 },
	{ id: 3, characterVersionId: 2, itemId: 1, count: 4 },
	{ id: 4, characterVersionId: 2, itemId: 2, count: 2 },
	{ id: 5, characterVersionId: 2, itemId: 3, count: 3 },
	{ id: 6, characterVersionId: 5, itemId: 1, count: 2 },
	{ id: 7, characterVersionId: 5, itemId: 3, count: 1 }
];
