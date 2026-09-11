import type { characters } from '../../src/lib/db/schema';

export const rows: (typeof characters.$inferInsert)[] = [
	{ id: 1, name: 'Bob', owner: 2 },
	{ id: 2, name: 'Alice', owner: 3 },
	{ id: 3, name: 'Eve', owner: 4 },
	{ id: 4, name: 'Mallory', owner: 2 },
	{ id: 5, name: 'Patric', owner: 2 }
];
