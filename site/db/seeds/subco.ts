import type { subco } from '../../src/lib/db/schema';

export const rows: (typeof subco.$inferInsert)[] = [
	{ id: 1, name: 'Subco 1', companyId: 1 },
	{ id: 2, name: 'Subco 2', companyId: 2 }
];
