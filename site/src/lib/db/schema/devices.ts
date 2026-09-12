/**
 * Devices and the role tables that say what each device is.
 *
 * Part of the schema described in `./index.ts` — see that file for the naming and
 * constraint-pinning rules that apply to every table here.
 *
 * A `Devices` row is only a name and a UID: the identity a piece of hardware presents, on the
 * wire or over MQTT. What it *is* lives entirely in the role tables below, keyed one-to-one on
 * `Devices.Id`. A device may hold more than one role, and a device with none is unclassified —
 * that is legal, and is what a freshly registered UID looks like before anyone decides what to
 * do with it.
 *
 * A **Port** is the plainest role there is: a `Device_Port` row and nothing else. It carries no
 * configured behaviour at all. What happens when an AguesGuard docks with a Port is decided by
 * whoever subscribes to the resulting `port.connected` / `port.disconnected` facts, which is how
 * a Game claims a Port without any registry change.
 *
 * `Devices` and `Device_Printer` were created by the missions epic as the minimal registry it
 * needed; they live here now, and the rest of the roles join them.
 */
import {
	foreignKey,
	int,
	mysqlTable,
	primaryKey,
	uniqueIndex,
	varchar
} from 'drizzle-orm/mysql-core';
import { characterVersions } from './characters';

export const devices = mysqlTable(
	'Devices',
	{
		id: int('Id').autoincrement().primaryKey(),
		name: varchar('Name', { length: 255 }).notNull(),
		uid: varchar('Uid', { length: 255 }).notNull()
	},
	(table) => [uniqueIndex('dev_uid').on(table.uid)]
);

/** A Port has no columns of its own — the row's existence is the whole role. */
export const devicePort = mysqlTable(
	'Device_Port',
	{
		deviceId: int('Device').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.deviceId] }),
		foreignKey({
			name: 'dprt_device',
			columns: [table.deviceId],
			foreignColumns: [devices.id]
		}).onDelete('cascade')
	]
);

/** The handheld: which character version is currently loaded onto it. */
export const deviceAguesGuard = mysqlTable(
	'Device_AguesGuard',
	{
		deviceId: int('Device').notNull(),
		characterVersionId: int('CharacterVersion').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.deviceId] }),
		foreignKey({
			name: 'dagd_device',
			columns: [table.deviceId],
			foreignColumns: [devices.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'dagd_character_version',
			columns: [table.characterVersionId],
			foreignColumns: [characterVersions.id]
		})
	]
);

/**
 * A Game watches one Port. `Port` references `Devices.Id` and the referenced device must itself
 * hold the Port role — a constraint the database cannot express, so the repo enforces it on
 * attach.
 */
export const deviceGame = mysqlTable(
	'Device_Game',
	{
		deviceId: int('Device').notNull(),
		portDeviceId: int('Port').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.deviceId] }),
		foreignKey({
			name: 'dgam_device',
			columns: [table.deviceId],
			foreignColumns: [devices.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'dgam_port',
			columns: [table.portDeviceId],
			foreignColumns: [devices.id]
		})
	]
);

export const devicePrinter = mysqlTable(
	'Device_Printer',
	{
		deviceId: int('Device').notNull(),
		printsAvailable: int('PrintsAvailable').notNull().default(0)
	},
	(table) => [
		primaryKey({ columns: [table.deviceId] }),
		foreignKey({
			name: 'dprn_device',
			columns: [table.deviceId],
			foreignColumns: [devices.id]
		}).onDelete('cascade')
	]
);

export const deviceLight = mysqlTable(
	'Device_Light',
	{
		deviceId: int('Device').notNull(),
		endpoint: varchar('Endpoint', { length: 255 }).notNull(),
		fixture: varchar('Fixture', { length: 255 }).notNull()
	},
	(table) => [
		primaryKey({ columns: [table.deviceId] }),
		foreignKey({
			name: 'dlgt_device',
			columns: [table.deviceId],
			foreignColumns: [devices.id]
		}).onDelete('cascade')
	]
);
