import type { sessionRoles, sessions } from '../../src/lib/db/schema';

export const rows: (typeof sessions.$inferInsert)[] = [
	{
		token: '7114b7ae-bec8-4af9-aefe-e44585709041',
		userId: 1,
		description: 'cmd yodi.vandenhende@gmail.com',
		start: new Date('2025-06-16T16:50:59Z'),
		end: null
	},
	{
		token: 'b8152d21-1517-454b-998a-dc93b6e5553d',
		userId: 1,
		description: 'api login yodi.vandenhende@gmail.com',
		start: new Date('2025-06-16T16:50:06Z'),
		end: new Date('2025-06-17T16:50:06Z')
	}
];

export const roleRows: (typeof sessionRoles.$inferInsert)[] = [
	{ token: '7114b7ae-bec8-4af9-aefe-e44585709041', role: 'player' },
	{ token: 'b8152d21-1517-454b-998a-dc93b6e5553d', role: 'admin' },
	{ token: 'b8152d21-1517-454b-998a-dc93b6e5553d', role: 'user' }
];
