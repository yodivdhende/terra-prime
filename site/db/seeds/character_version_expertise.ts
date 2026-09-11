import type { characterVersionExpertise } from '../../src/lib/db/schema';

export const rows: (typeof characterVersionExpertise.$inferInsert)[] = [
	{ id: 1, characterVersionId: 1, expertiseId: 1, value: 10 },
	{ id: 2, characterVersionId: 1, expertiseId: 2, value: 40 },
	{ id: 3, characterVersionId: 1, expertiseId: 3, value: 50 },
	{ id: 4, characterVersionId: 2, expertiseId: 1, value: 10 },
	{ id: 5, characterVersionId: 2, expertiseId: 2, value: 10 },
	{ id: 6, characterVersionId: 2, expertiseId: 4, value: 10 },
	{ id: 7, characterVersionId: 5, expertiseId: 3, value: 10 },
	{ id: 8, characterVersionId: 5, expertiseId: 6, value: 10 },
	{ id: 9, characterVersionId: 5, expertiseId: 9, value: 10 }
];
