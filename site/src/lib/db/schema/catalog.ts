/**
 * The reference catalog: expertise and its groups, items, implants, and the point-cost table.
 *
 * Part of the schema described in `./index.ts` — see that file for the naming and
 * constraint-pinning rules that apply to every table here.
 */
import { sql } from 'drizzle-orm';
import {
	check,
	foreignKey,
	index,
	int,
	mysqlEnum,
	mysqlTable,
	primaryKey,
	text,
	tinyint,
	varchar
} from 'drizzle-orm/mysql-core';
import { characterAccess } from './enums';

export const expertiseGroups = mysqlTable('Expertise_Groups', {
	id: int('Id').autoincrement().primaryKey(),
	name: varchar('Name', { length: 255 }).notNull(),
	description: text('Description').notNull(),
	icon: text('Icon'),
	color: varchar('Color', { length: 7 })
});

export const expertise = mysqlTable(
	'Expertise',
	{
		id: int('Id').autoincrement().primaryKey(),
		groupId: int('Group'),
		name: varchar('Name', { length: 255 }),
		description: text('Description'),
		characterAccess: mysqlEnum('CharacterAccess', characterAccess).notNull().default('all'),
		icon: text('Icon')
	},
	(table) => [
		index('Group').on(table.groupId),
		foreignKey({
			name: 'Expertise_ibfk_1',
			columns: [table.groupId],
			foreignColumns: [expertiseGroups.id]
		})
	]
);

export const expertisePointCosts = mysqlTable(
	'Expertise_Point_Costs',
	{
		point: tinyint('Point').notNull(),
		cost: int('Cost').notNull().default(0)
	},
	(table) => [
		primaryKey({ columns: [table.point] }),
		check('epc_point_range', sql`\`Point\` between 0 and 100`)
	]
);

export const items = mysqlTable('Items', {
	id: int('Id').autoincrement().primaryKey(),
	name: varchar('Name', { length: 255 }).notNull(),
	description: text('Description').notNull(),
	cost: int('Cost').notNull().default(0),
	maxPerCharacter: int('MaxPerCharacter'),
	characterAccess: mysqlEnum('CharacterAccess', characterAccess).notNull().default('all')
});

export const implants = mysqlTable('Implants', {
	id: int('Id').autoincrement().primaryKey(),
	name: varchar('Name', { length: 255 }).notNull(),
	description: text('Description').notNull(),
	cost: int('Cost').notNull().default(0),
	characterAccess: mysqlEnum('CharacterAccess', characterAccess).notNull().default('all')
});
