/**
 * Events, their players and extras, and budget coupons.
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

/**
 * The one character version a player plays at an event, keyed on (Event, User).
 *
 * Renamed from `Event_Participants` by `0001_add_extras`; MySQL's `RENAME TABLE` keeps constraint
 * names, so the foreign keys are still called `Event_Participants_ibfk_*` on the renamed table and
 * stay pinned to those names here — the same convention as the `Skill` index in `characters.ts`.
 */
export const eventPlayers = mysqlTable(
	'Event_Players',
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

/**
 * Crew / NPC actors at an event. Unlike a player, an extra may hold several NPC versions over one
 * event, so this table carries its own id and many rows per (Event, User).
 */
export const eventExtras = mysqlTable(
	'Event_Extras',
	{
		id: int('Id').autoincrement().primaryKey(),
		eventId: int('Event').notNull(),
		userId: int('User').notNull(),
		// Null while an extra is enrolled but has not been handed a character yet.
		characterVersionId: int('CharacterVersion')
	},
	(table) => [
		// MySQL allows repeated NULLs in a unique index, so "enrolled, nothing assigned yet" is
		// representable while a given version still cannot be handed to two people at one event.
		uniqueIndex('ee_event_version').on(table.eventId, table.characterVersionId),
		index('ee_event_user').on(table.eventId, table.userId),
		foreignKey({ name: 'ee_event', columns: [table.eventId], foreignColumns: [events.id] }),
		foreignKey({ name: 'ee_user', columns: [table.userId], foreignColumns: [users.id] }),
		foreignKey({
			name: 'ee_version',
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
