/**
 * Events, their participants, and budget coupons.
 *
 * Part of the schema described in `./index.ts` — see that file for the naming and
 * constraint-pinning rules that apply to every table here.
 */
import {
	datetime,
	foreignKey,
	index,
	int,
	mysqlEnum,
	mysqlTable,
	primaryKey,
	uniqueIndex,
	varchar
} from 'drizzle-orm/mysql-core';
import { eventStatus } from './enums';
import { users } from './auth';
import { characterVersions } from './characters';

export const events = mysqlTable('Events', {
	id: int('Id').autoincrement().primaryKey(),
	name: varchar('Name', { length: 254 }),
	startTime: datetime('StartTime'),
	endTime: datetime('EndTime'),
	status: mysqlEnum('Status', eventStatus).default('Draft'),
	budget: int('Budget'),
	formId: varchar('FormId', { length: 128 }),
	sheetId: varchar('SheetId', { length: 128 }),
	rewardBudget: int('RewardBudget')
});

export const eventParticipants = mysqlTable(
	'Event_Participants',
	{
		eventId: int('Event').notNull(),
		userId: int('User').notNull(),
		characterVersionId: int('CharacterVersion')
	},
	(table) => [
		primaryKey({ columns: [table.eventId, table.userId] }),
		index('User').on(table.userId),
		foreignKey({
			name: 'Event_Participants_ibfk_1',
			columns: [table.eventId],
			foreignColumns: [events.id]
		}),
		foreignKey({
			name: 'Event_Participants_ibfk_2',
			columns: [table.userId],
			foreignColumns: [users.id]
		}),
		foreignKey({
			name: 'Event_Participants_ibfk_3',
			columns: [table.characterVersionId],
			foreignColumns: [characterVersions.id]
		})
	]
);

export const eventCoupons = mysqlTable(
	'Event_Coupons',
	{
		id: int('Id').autoincrement().primaryKey(),
		eventId: int('Event').notNull(),
		userId: int('User').notNull(),
		code: varchar('Code', { length: 64 }).notNull(),
		type: mysqlEnum('Type', ['budget']).notNull().default('budget'),
		value: int('Value').notNull().default(0),
		redeemedAt: datetime('RedeemedAt')
	},
	(table) => [
		uniqueIndex('ec_code').on(table.code),
		index('ec_event_user').on(table.eventId, table.userId),
		foreignKey({
			name: 'ec_event',
			columns: [table.eventId],
			foreignColumns: [events.id]
		}),
		foreignKey({
			name: 'ec_user',
			columns: [table.userId],
			foreignColumns: [users.id]
		})
	]
);
