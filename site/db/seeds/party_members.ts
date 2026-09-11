import type { partyMembers } from '../../src/lib/db/schema';

export const rows: (typeof partyMembers.$inferInsert)[] = [
	{ partyId: 1, memberId: 1 },
	{ partyId: 1, memberId: 2 },
	{ partyId: 2, memberId: 4 }
];
