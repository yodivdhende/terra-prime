import type { party } from '../../src/lib/db/schema';

export const rows: (typeof party.$inferInsert)[] = [
	{ id: 1, name: 'Party 1' },
	{ id: 2, name: 'Party 2' }
];
