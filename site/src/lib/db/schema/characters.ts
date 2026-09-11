/**
 * Characters, their versions and version contents, per-character access grants, and parties.
 *
 * Part of the schema described in `./index.ts` — see that file for the naming and
 * constraint-pinning rules that apply to every table here.
 */
import {
	datetime,
	foreignKey,
	index,
	int,
	mysqlTable,
	primaryKey,
	varchar
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';
import { expertise, implants, items } from './catalog';
import { companies } from './companies';

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

export const subco = mysqlTable(
	'Subco',
	{
		id: int('Id').autoincrement().primaryKey(),
		name: varchar('Name', { length: 254 }),
		companyId: int('Company').notNull(),
		backstoryId: varchar('BackstoryId', { length: 128 })
	},
	(table) => [
		index('subco_company_key').on(table.companyId),
		foreignKey({
			name: 'subco_company',
			columns: [table.companyId],
			foreignColumns: [companies.id]
		})
	]
);

export const subcoMembers = mysqlTable(
	'Subco_Members',
	{
		subcoId: int('Subco').notNull(),
		memberId: int('Member').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.subcoId, table.memberId] }),
		index('Member').on(table.memberId),
		foreignKey({
			name: 'Subco_Members_ibfk_1',
			columns: [table.subcoId],
			foreignColumns: [subco.id]
		}),
		foreignKey({
			name: 'Subco_Members_ibfk_2',
			columns: [table.memberId],
			foreignColumns: [characters.id]
		})
	]
);

/**
 * Email-based invites to join a subco. The token stores the invited *email* because the invitee
 * may not be a `Users` row yet (mirror `Password_Reset_Tokens`).
 */
export const subcoInvites = mysqlTable(
	'Subco_Invites',
	{
		token: varchar('Token', { length: 36 }).primaryKey(),
		subcoId: int('Subco').notNull(),
		email: varchar('Email', { length: 255 }).notNull(),
		characterId: int('CharacterId'),
		createdAt: datetime('CreatedAt')
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		expiresAt: datetime('ExpiresAt'),
		status: varchar('Status', { length: 10 }).notNull().default('invited')
	},
	(table) => [
		index('si_subco_key').on(table.subcoId),
		index('si_character_key').on(table.characterId),
		foreignKey({
			name: 'si_subco_fk',
			columns: [table.subcoId],
			foreignColumns: [subco.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'si_character_fk',
			columns: [table.characterId],
			foreignColumns: [characters.id]
		}).onDelete('set null')
	]
);
