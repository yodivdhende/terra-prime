import type { subcoMembers } from '../../src/lib/db/schema';

export const rows: (typeof subcoMembers.$inferInsert)[] = [
	{ subcoId: 1, memberId: 1 },
	{ subcoId: 1, memberId: 2 },
	{ subcoId: 2, memberId: 4 }
];
