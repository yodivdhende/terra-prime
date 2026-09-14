/**
 * Missions, their participants, and the printer devices attached to them.
 *
 * Part of the schema described in `./index.ts` — see that file for the naming and
 * constraint-pinning rules that apply to every table here.
 *
 * A mission owns no print pool. How many prints it has is
 * `SUM(Device_Printer.PrintsAvailable)` across the printers linked to it through
 * `Mission_Printer`, so wheeling a printer in or out changes a mission's availability without
 * any `Missions` row being edited. There is deliberately no `PrintPool` column.
 *
 * `Devices` and `Device_Printer` moved to `./devices.ts` when the device model grew the rest of
 * its roles. Nothing here changed: a mission still reaches a printer through `Mission_Printer`.
 */
import {
	datetime,
	foreignKey,
	int,
	mysqlEnum,
	mysqlTable,
	primaryKey,
	varchar
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { missionStatus } from './enums';
import { characterVersions } from './characters';
import { devicePrinter, devices } from './devices';

export const missions = mysqlTable('Missions', {
	id: int('Id').autoincrement().primaryKey(),
	name: varchar('Name', { length: 255 }).notNull(),
	playerLimit: int('PlayerLimit').notNull().default(0),
	status: mysqlEnum('Status', missionStatus).notNull().default('open'),
	createdAt: datetime('CreatedAt')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

/** No `User` column: the player is derived via `CharacterVersion -> Character -> Owner`. */
export const missionParticipants = mysqlTable(
	'Mission_Participants',
	{
		missionId: int('Mission').notNull(),
		characterVersionId: int('CharacterVersion').notNull(),
		availablePrints: int('AvailablePrints').notNull().default(0),
		registerAt: datetime('RegisterAt')
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`)
	},
	(table) => [
		primaryKey({ columns: [table.missionId, table.characterVersionId] }),
		foreignKey({
			name: 'mpart_mission',
			columns: [table.missionId],
			foreignColumns: [missions.id]
		}),
		foreignKey({
			name: 'mpart_character_version',
			columns: [table.characterVersionId],
			foreignColumns: [characterVersions.id]
		})
	]
);

/**
 * Association only. A mission's available prints are the sum of `Device_Printer.PrintsAvailable`
 * over these rows.
 */
export const missionPrinter = mysqlTable(
	'Mission_Printer',
	{
		missionId: int('Mission').notNull(),
		deviceId: int('Device').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.missionId, table.deviceId] }),
		foreignKey({
			name: 'mprn_mission',
			columns: [table.missionId],
			foreignColumns: [missions.id]
		}),
		foreignKey({
			name: 'mprn_device',
			columns: [table.deviceId],
			foreignColumns: [devices.id]
		})
	]
);
