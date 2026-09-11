import type { expertisePointCosts } from '../../src/lib/db/schema';

export const rows: (typeof expertisePointCosts.$inferInsert)[] = [
	{ point: 0, cost: 0 },
	{ point: 10, cost: 10 },
	{ point: 20, cost: 30 },
	{ point: 30, cost: 70 },
	{ point: 40, cost: 130 },
	{ point: 50, cost: 210 },
	{ point: 60, cost: 310 },
	{ point: 70, cost: 430 },
	{ point: 80, cost: 570 },
	{ point: 90, cost: 740 },
	{ point: 100, cost: 950 }
];
