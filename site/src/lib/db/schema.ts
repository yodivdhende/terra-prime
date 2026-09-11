/**
 * Drizzle schema for the Terra Prime database.
 *
 * The physical schema predates Drizzle: tables and columns are PascalCase, so every column
 * declares its database name explicitly and exposes a camelCase TypeScript property. Index and
 * foreign-key constraint names are pinned to the names the pre-Drizzle migrations created, so the
 * generated baseline in `drizzle/` matches existing dev, staging, and production databases exactly.
 *
 * Indexes MySQL creates implicitly for a foreign key (where the index name equals the constraint
 * name) are not declared here — adding the foreign key creates them.
 */
import { relations } from 'drizzle-orm';
import {
	boolean,
	check,
	datetime,
	foreignKey,
	index,
	int,
	json,
	mysqlEnum,
	mysqlTable,
	primaryKey,
	text,
	tinyint,
	uniqueIndex,
	varchar
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const characterAccess = ['all', 'none', 'specific'] as const;
export const eventStatus = ['Draft', 'Open', 'Live', 'Canceled', 'Done'] as const;

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

export const companies = mysqlTable('Companies', {
	id: int('Id').autoincrement().primaryKey(),
	name: varchar('Name', { length: 255 }).notNull(),
	description: text('Description').notNull(),
	link: varchar('Link', { length: 2048 })
});

export const characters = mysqlTable(
	'Characters',
	{
		id: int('Id').autoincrement().primaryKey(),
		name: varchar('Name', { length: 254 }),
		owner: int('Owner'),
		backstoryId: varchar('BackstoryId', { length: 128 }),
		implantLimit: int('ImplantLimit').notNull().default(2)
	},
	(table) => [
		index('Owner').on(table.owner),
		foreignKey({
			name: 'Characters_ibfk_1',
			columns: [table.owner],
			foreignColumns: [users.id]
		})
	]
);

export const characterVersions = mysqlTable(
	'Character_Versions',
	{
		id: int('Id').autoincrement().primaryKey(),
		characterId: int('Character').notNull(),
		name: varchar('Name', { length: 254 }),
		companyId: int('Company').notNull()
	},
	(table) => [
		index('Character').on(table.characterId),
		index('cv_company_key').on(table.companyId),
		foreignKey({
			name: 'Character_Versions_Characters',
			columns: [table.characterId],
			foreignColumns: [characters.id]
		}),
		foreignKey({
			name: 'cv_company',
			columns: [table.companyId],
			foreignColumns: [companies.id]
		})
	]
);

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

export const characterVersionExpertise = mysqlTable(
	'Character_Version_Expertise',
	{
		id: int('Id').autoincrement().primaryKey(),
		characterVersionId: int('CharacterVersion'),
		expertiseId: int('Expertise'),
		value: int('Value')
	},
	(table) => [
		index('CharacterVersion').on(table.characterVersionId),
		// Named `Skill` because 0013_rename_skills_to_expertise renamed the column but not the index.
		index('Skill').on(table.expertiseId),
		foreignKey({
			name: 'Character_Version_Expertise_ibfk_1',
			columns: [table.characterVersionId],
			foreignColumns: [characterVersions.id]
		})
	]
);

export const characterVersionImplants = mysqlTable(
	'Character_Version_Implants',
	{
		id: int('Id').autoincrement().primaryKey(),
		characterVersionId: int('CharacterVersion'),
		implantId: int('Implant'),
		slot: int('Slot').notNull().default(1)
	},
	(table) => [
		index('CharacterVersion').on(table.characterVersionId),
		index('Implant').on(table.implantId),
		foreignKey({
			name: 'Character_Version_Implants_ibfk_1',
			columns: [table.characterVersionId],
			foreignColumns: [characterVersions.id]
		}),
		foreignKey({
			name: 'Character_Version_Implants_ibfk_2',
			columns: [table.implantId],
			foreignColumns: [implants.id]
		})
	]
);

export const characterVersionItems = mysqlTable(
	'Character_Version_Items',
	{
		id: int('Id').autoincrement().primaryKey(),
		characterVersionId: int('CharacterVersion'),
		itemId: int('Item'),
		count: int('Count').default(1)
	},
	(table) => [
		index('CharacterVersion').on(table.characterVersionId),
		index('Item').on(table.itemId),
		foreignKey({
			name: 'Character_Version_Items_ibfk_1',
			columns: [table.characterVersionId],
			foreignColumns: [characterVersions.id]
		}),
		foreignKey({
			name: 'Character_Version_Items_ibfk_2',
			columns: [table.itemId],
			foreignColumns: [items.id]
		})
	]
);

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

export const companyDiscountsItems = mysqlTable(
	'Company_Discounts_Items',
	{
		companyId: int('Company').notNull(),
		itemId: int('Item').notNull(),
		discount: int('Discount').notNull().default(0)
	},
	(table) => [
		primaryKey({ columns: [table.companyId, table.itemId] }),
		foreignKey({
			name: 'cdi_company',
			columns: [table.companyId],
			foreignColumns: [companies.id]
		}),
		foreignKey({ name: 'cdi_item', columns: [table.itemId], foreignColumns: [items.id] }),
		check('cdi_discount_pct', sql`\`Discount\` between 0 and 100`)
	]
);

export const companyDiscountsImplants = mysqlTable(
	'Company_Discounts_Implants',
	{
		companyId: int('Company').notNull(),
		implantId: int('Implant').notNull(),
		discount: int('Discount').notNull().default(0)
	},
	(table) => [
		primaryKey({ columns: [table.companyId, table.implantId] }),
		foreignKey({
			name: 'cdim_company',
			columns: [table.companyId],
			foreignColumns: [companies.id]
		}),
		foreignKey({ name: 'cdim_implant', columns: [table.implantId], foreignColumns: [implants.id] }),
		check('cdim_discount_pct', sql`\`Discount\` between 0 and 100`)
	]
);

export const companyDiscountsExpertise = mysqlTable(
	'Company_Discounts_Expertise',
	{
		companyId: int('Company').notNull(),
		expertiseId: int('Expertise').notNull(),
		discount: int('Discount').notNull().default(0)
	},
	(table) => [
		primaryKey({ columns: [table.companyId, table.expertiseId] }),
		foreignKey({
			name: 'cds_company',
			columns: [table.companyId],
			foreignColumns: [companies.id]
		}),
		// Named `cds_skill` because 0013_rename_skills_to_expertise left the constraint name alone.
		foreignKey({ name: 'cds_skill', columns: [table.expertiseId], foreignColumns: [expertise.id] }),
		check('cde_discount_pct', sql`\`Discount\` between 0 and 100`)
	]
);

export const itemCharacterAccess = mysqlTable(
	'Item_Character_Access',
	{
		itemId: int('ItemId').notNull(),
		characterId: int('CharacterId').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.itemId, table.characterId] }),
		foreignKey({ name: 'ica_item', columns: [table.itemId], foreignColumns: [items.id] }),
		foreignKey({
			name: 'ica_character',
			columns: [table.characterId],
			foreignColumns: [characters.id]
		})
	]
);

export const implantCharacterAccess = mysqlTable(
	'Implant_Character_Access',
	{
		implantId: int('ImplantId').notNull(),
		characterId: int('CharacterId').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.implantId, table.characterId] }),
		foreignKey({ name: 'imca_implant', columns: [table.implantId], foreignColumns: [implants.id] }),
		foreignKey({
			name: 'imca_character',
			columns: [table.characterId],
			foreignColumns: [characters.id]
		})
	]
);

export const expertiseCharacterAccess = mysqlTable(
	'Expertise_Character_Access',
	{
		expertiseId: int('ExpertiseId').notNull(),
		characterId: int('CharacterId').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.expertiseId, table.characterId] }),
		foreignKey({
			name: 'eca_expertise',
			columns: [table.expertiseId],
			foreignColumns: [expertise.id]
		}),
		foreignKey({
			name: 'eca_character',
			columns: [table.characterId],
			foreignColumns: [characters.id]
		})
	]
);

export const party = mysqlTable('Party', {
	id: int('Id').autoincrement().primaryKey(),
	name: varchar('Name', { length: 254 })
});

export const partyMembers = mysqlTable(
	'Party_Members',
	{
		partyId: int('Party').notNull(),
		memberId: int('Member').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.partyId, table.memberId] }),
		index('Member').on(table.memberId),
		foreignKey({
			name: 'Party_Members_ibfk_1',
			columns: [table.partyId],
			foreignColumns: [party.id]
		}),
		foreignKey({
			name: 'Party_Members_ibfk_2',
			columns: [table.memberId],
			foreignColumns: [characters.id]
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

/* -------------------------------------------------------------------------- */
/*  Relations — used by the relational query API (`db.query.*`)                */
/* -------------------------------------------------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
	admin: many(admins),
	characters: many(characters),
	sessions: many(sessions),
	eventParticipations: many(eventParticipants),
	eventCoupons: many(eventCoupons),
	emailVerificationTokens: many(emailVerificationTokens),
	passwordResetTokens: many(passwordResetTokens)
}));

export const adminsRelations = relations(admins, ({ one }) => ({
	user: one(users, { fields: [admins.userId], references: [users.id] })
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
	owner: one(users, { fields: [characters.owner], references: [users.id] }),
	versions: many(characterVersions),
	partyMemberships: many(partyMembers),
	itemAccess: many(itemCharacterAccess),
	implantAccess: many(implantCharacterAccess),
	expertiseAccess: many(expertiseCharacterAccess)
}));

export const characterVersionsRelations = relations(characterVersions, ({ one, many }) => ({
	character: one(characters, {
		fields: [characterVersions.characterId],
		references: [characters.id]
	}),
	company: one(companies, {
		fields: [characterVersions.companyId],
		references: [companies.id]
	}),
	expertise: many(characterVersionExpertise),
	implants: many(characterVersionImplants),
	items: many(characterVersionItems),
	eventParticipations: many(eventParticipants)
}));

export const companiesRelations = relations(companies, ({ many }) => ({
	characterVersions: many(characterVersions),
	itemDiscounts: many(companyDiscountsItems),
	implantDiscounts: many(companyDiscountsImplants),
	expertiseDiscounts: many(companyDiscountsExpertise)
}));

export const expertiseRelations = relations(expertise, ({ one, many }) => ({
	group: one(expertiseGroups, {
		fields: [expertise.groupId],
		references: [expertiseGroups.id]
	}),
	characterVersions: many(characterVersionExpertise),
	companyDiscounts: many(companyDiscountsExpertise),
	characterAccess: many(expertiseCharacterAccess)
}));

export const expertiseGroupsRelations = relations(expertiseGroups, ({ many }) => ({
	expertise: many(expertise)
}));

export const itemsRelations = relations(items, ({ many }) => ({
	characterVersions: many(characterVersionItems),
	companyDiscounts: many(companyDiscountsItems),
	characterAccess: many(itemCharacterAccess)
}));

export const implantsRelations = relations(implants, ({ many }) => ({
	characterVersions: many(characterVersionImplants),
	companyDiscounts: many(companyDiscountsImplants),
	characterAccess: many(implantCharacterAccess)
}));

export const characterVersionExpertiseRelations = relations(
	characterVersionExpertise,
	({ one }) => ({
		characterVersion: one(characterVersions, {
			fields: [characterVersionExpertise.characterVersionId],
			references: [characterVersions.id]
		}),
		expertise: one(expertise, {
			fields: [characterVersionExpertise.expertiseId],
			references: [expertise.id]
		})
	})
);

export const characterVersionImplantsRelations = relations(characterVersionImplants, ({ one }) => ({
	characterVersion: one(characterVersions, {
		fields: [characterVersionImplants.characterVersionId],
		references: [characterVersions.id]
	}),
	implant: one(implants, {
		fields: [characterVersionImplants.implantId],
		references: [implants.id]
	})
}));

export const characterVersionItemsRelations = relations(characterVersionItems, ({ one }) => ({
	characterVersion: one(characterVersions, {
		fields: [characterVersionItems.characterVersionId],
		references: [characterVersions.id]
	}),
	item: one(items, { fields: [characterVersionItems.itemId], references: [items.id] })
}));

export const eventsRelations = relations(events, ({ many }) => ({
	participants: many(eventParticipants),
	coupons: many(eventCoupons)
}));

export const eventParticipantsRelations = relations(eventParticipants, ({ one }) => ({
	event: one(events, { fields: [eventParticipants.eventId], references: [events.id] }),
	user: one(users, { fields: [eventParticipants.userId], references: [users.id] }),
	characterVersion: one(characterVersions, {
		fields: [eventParticipants.characterVersionId],
		references: [characterVersions.id]
	})
}));

export const eventCouponsRelations = relations(eventCoupons, ({ one }) => ({
	event: one(events, { fields: [eventCoupons.eventId], references: [events.id] }),
	user: one(users, { fields: [eventCoupons.userId], references: [users.id] })
}));

export const companyDiscountsItemsRelations = relations(companyDiscountsItems, ({ one }) => ({
	company: one(companies, {
		fields: [companyDiscountsItems.companyId],
		references: [companies.id]
	}),
	item: one(items, { fields: [companyDiscountsItems.itemId], references: [items.id] })
}));

export const companyDiscountsImplantsRelations = relations(companyDiscountsImplants, ({ one }) => ({
	company: one(companies, {
		fields: [companyDiscountsImplants.companyId],
		references: [companies.id]
	}),
	implant: one(implants, {
		fields: [companyDiscountsImplants.implantId],
		references: [implants.id]
	})
}));

export const companyDiscountsExpertiseRelations = relations(
	companyDiscountsExpertise,
	({ one }) => ({
		company: one(companies, {
			fields: [companyDiscountsExpertise.companyId],
			references: [companies.id]
		}),
		expertise: one(expertise, {
			fields: [companyDiscountsExpertise.expertiseId],
			references: [expertise.id]
		})
	})
);

export const itemCharacterAccessRelations = relations(itemCharacterAccess, ({ one }) => ({
	item: one(items, { fields: [itemCharacterAccess.itemId], references: [items.id] }),
	character: one(characters, {
		fields: [itemCharacterAccess.characterId],
		references: [characters.id]
	})
}));

export const implantCharacterAccessRelations = relations(implantCharacterAccess, ({ one }) => ({
	implant: one(implants, { fields: [implantCharacterAccess.implantId], references: [implants.id] }),
	character: one(characters, {
		fields: [implantCharacterAccess.characterId],
		references: [characters.id]
	})
}));

export const expertiseCharacterAccessRelations = relations(expertiseCharacterAccess, ({ one }) => ({
	expertise: one(expertise, {
		fields: [expertiseCharacterAccess.expertiseId],
		references: [expertise.id]
	}),
	character: one(characters, {
		fields: [expertiseCharacterAccess.characterId],
		references: [characters.id]
	})
}));

export const partyRelations = relations(party, ({ many }) => ({
	members: many(partyMembers)
}));

export const partyMembersRelations = relations(partyMembers, ({ one }) => ({
	party: one(party, { fields: [partyMembers.partyId], references: [party.id] }),
	member: one(characters, { fields: [partyMembers.memberId], references: [characters.id] })
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
	roles: many(sessionRoles)
}));

export const sessionRolesRelations = relations(sessionRoles, ({ one }) => ({
	session: one(sessions, { fields: [sessionRoles.token], references: [sessions.token] })
}));

export const messagesRelations = relations(messages, ({ one }) => ({
	senderUser: one(users, { fields: [messages.sender], references: [users.id] }),
	recipientUser: one(users, { fields: [messages.recipient], references: [users.id] })
}));

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
	user: one(users, { fields: [emailVerificationTokens.userId], references: [users.id] })
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
	user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] })
}));
