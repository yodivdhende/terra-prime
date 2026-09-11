import type { characterVersionImplants } from '../../src/lib/db/schema';

export const rows: (typeof characterVersionImplants.$inferInsert)[] = [
	{ id: 1, characterVersionId: 1, implantId: 1 },
	{ id: 2, characterVersionId: 1, implantId: 2 },
	{ id: 3, characterVersionId: 2, implantId: 1 },
	{ id: 4, characterVersionId: 2, implantId: 2 }
];
