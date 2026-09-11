import type { events } from '../../src/lib/db/schema';

export const rows: (typeof events.$inferInsert)[] = [
	{
		id: 1,
		name: 'Event 1',
		startTime: new Date('2023-10-01T10:00:00Z'),
		endTime: new Date('2023-10-03T12:00:00Z'),
		status: 'Canceled',
		budget: 2000
	},
	{
		id: 2,
		name: 'Event 2',
		startTime: new Date('2026-10-01T10:00:00Z'),
		endTime: new Date('2026-10-03T12:00:00Z'),
		status: 'Open',
		budget: 2000
	}
];
