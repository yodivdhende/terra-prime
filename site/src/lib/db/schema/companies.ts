/**
 * Companies and their per-catalog discount tables.
 *
 * Part of the schema described in `./index.ts` — see that file for the naming and
 * constraint-pinning rules that apply to every table here.
 */
import { sql } from 'drizzle-orm';
import {
	check,
	foreignKey,
	int,
	mysqlTable,
	primaryKey,
	text,
	varchar
} from 'drizzle-orm/mysql-core';
import { expertise, implants, items } from './catalog';

export const companies = mysqlTable('Companies', {
	id: int('Id').autoincrement().primaryKey(),
	name: varchar('Name', { length: 255 }).notNull(),
	description: text('Description').notNull(),
	link: varchar('Link', { length: 2048 })
});

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
