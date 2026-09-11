/**
 * Users, admins, sessions, messages, and the e-mail token tables.
 *
 * Part of the schema described in `./index.ts` — see that file for the naming and
 * constraint-pinning rules that apply to every table here.
 */
import { sql } from 'drizzle-orm';
import {
	boolean,
	datetime,
	foreignKey,
	index,
	int,
	json,
	mysqlTable,
	primaryKey,
	text,
	uniqueIndex,
	varchar
} from 'drizzle-orm/mysql-core';

export const users = mysqlTable('Users', {
	id: int('Id').autoincrement().primaryKey(),
	name: varchar('Name', { length: 255 }),
	email: varchar('Email', { length: 255 }),
	password: varchar('Password', { length: 255 }),
	verified: boolean('Verified').notNull().default(false)
});

export const admins = mysqlTable(
	'Admins',
	{
		userId: int('UserId').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.userId] }),
		foreignKey({
			name: 'Admins_ibfk_1',
			columns: [table.userId],
			foreignColumns: [users.id]
		})
	]
);

export const sessions = mysqlTable(
	'Sessions',
	{
		token: varchar('Token', { length: 255 }).notNull(),
		userId: int('UserId'),
		description: varchar('Description', { length: 500 }),
		start: datetime('Start').notNull(),
		end: datetime('End')
	},
	(table) => [
		primaryKey({ columns: [table.token] }),
		foreignKey({ name: 'Sessions_ibfk_1', columns: [table.userId], foreignColumns: [users.id] })
	]
);

export const sessionRoles = mysqlTable(
	'Session_Roles',
	{
		token: varchar('Token', { length: 255 }).notNull(),
		role: varchar('Role', { length: 255 }).notNull()
	},
	(table) => [
		primaryKey({ columns: [table.token, table.role] }),
		foreignKey({
			name: 'Session_Roles_ibfk_1',
			columns: [table.token],
			foreignColumns: [sessions.token]
		})
	]
);

export const messages = mysqlTable(
	'Messages',
	{
		id: int('Id').autoincrement().primaryKey(),
		sender: int('Sender'),
		recipient: int('Recipient').notNull(),
		subject: varchar('Subject', { length: 512 }).notNull(),
		message: text('Message').notNull(),
		attachment: json('Attachment').notNull()
	},
	(table) => [
		foreignKey({ name: 'Messages_ibfk_1', columns: [table.sender], foreignColumns: [users.id] }),
		foreignKey({ name: 'Messages_ibfk_2', columns: [table.recipient], foreignColumns: [users.id] })
	]
);

export const emailTemplates = mysqlTable(
	'Email_Templates',
	{
		id: int('Id').autoincrement().primaryKey(),
		key: varchar('Key', { length: 64 }).notNull(),
		docUrl: varchar('DocUrl', { length: 2048 }).notNull()
	},
	(table) => [uniqueIndex('et_key_unique').on(table.key)]
);

export const emailVerificationTokens = mysqlTable(
	'Email_Verification_Tokens',
	{
		token: varchar('Token', { length: 255 }).notNull(),
		userId: int('UserId').notNull(),
		createdAt: datetime('CreatedAt')
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		expiresAt: datetime('ExpiresAt').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.token] }),
		index('evt_user_key').on(table.userId),
		foreignKey({
			name: 'evt_user_fk',
			columns: [table.userId],
			foreignColumns: [users.id]
		}).onDelete('cascade')
	]
);

export const passwordResetTokens = mysqlTable(
	'Password_Reset_Tokens',
	{
		token: varchar('Token', { length: 255 }).notNull(),
		userId: int('UserId').notNull(),
		createdAt: datetime('CreatedAt')
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		expiresAt: datetime('ExpiresAt').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.token] }),
		index('prt_user_key').on(table.userId),
		foreignKey({
			name: 'prt_user_fk',
			columns: [table.userId],
			foreignColumns: [users.id]
		}).onDelete('cascade')
	]
);
