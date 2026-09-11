import type { characterVersions } from '../../src/lib/db/schema';

export const rows: (typeof characterVersions.$inferInsert)[] = [
	{ id: 1, characterId: 1, name: 'Version 1', companyId: 1 },
	{ id: 2, characterId: 1, name: 'Version 2', companyId: 2 },
	{ id: 3, characterId: 2, name: 'Version 1', companyId: 3 },
	{ id: 4, characterId: 3, name: 'Version 1', companyId: 4 },
	{ id: 5, characterId: 4, name: 'Version 1', companyId: 5 }
];
