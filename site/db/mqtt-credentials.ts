/**
 * Builds the broker's per-device credential list from the device registry.
 *
 * The registry is the only place that knows which UIDs exist and what each one is, and the ACL the
 * broker writes is keyed on exactly those two facts — so generating the list by hand means it
 * drifts from reality the first time someone adds a prop. Prints JSON for
 * `MQTT_DEVICE_CREDENTIALS` on the broker service, and the matching `mqtt` block for each
 * device's SD card `config.json`.
 *
 * Passwords are per device and are never stored server-side: the broker holds a hash, the device
 * holds the plaintext on its card, and nothing else needs to know. That means a rotation is a
 * trip to every affected card, which is why an existing list is read back in and preserved —
 * `MQTT_DEVICE_CREDENTIALS='<current>' pnpm mqtt:credentials` adds the new props and leaves every
 * flashed card working.
 *
 * Run from `site/` with the usual `MYSQL*` variables set, same as `pnpm migrate`.
 */
import { randomBytes } from 'node:crypto';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import {
	deviceAguesGuard,
	deviceGame,
	deviceLight,
	devicePort,
	devicePrinter,
	devices
} from '../src/lib/db/schema/devices';
import { isTopicSafeUid } from '../src/lib/realtime/topics';

type Credential = { uid: string; password: string; roles: string[] };

function newPassword(): string {
	// base64url of 24 bytes: no shell-quoting hazards in a Railway variable, no ambiguity when
	// someone has to read it off a screen and type it into a config file on an SD card.
	return randomBytes(24).toString('base64url');
}

function existingPasswords(): Map<string, string> {
	const raw = process.env.MQTT_DEVICE_CREDENTIALS;
	if (raw == null || raw.length === 0) return new Map();
	try {
		const parsed: unknown = JSON.parse(raw);
		if (Array.isArray(parsed) === false) throw new Error('not an array');
		return new Map(
			parsed
				.filter(
					(entry): entry is Credential =>
						typeof entry === 'object' &&
						entry !== null &&
						typeof (entry as Credential).uid === 'string' &&
						typeof (entry as Credential).password === 'string'
				)
				.map((entry) => [entry.uid, entry.password])
		);
	} catch (error) {
		console.error('MQTT_DEVICE_CREDENTIALS is set but unreadable - refusing to rotate blindly');
		throw error;
	}
}

async function main() {
	const connection = await mysql.createConnection({
		host: process.env.MYSQLHOST,
		port: Number(process.env.MYSQLPORT ?? 3306),
		user: process.env.MYSQLUSER,
		password: process.env.MYSQLPASSWORD,
		database: process.env.MYSQLDATABASE
	});
	const db = drizzle(connection);

	const rows = await db
		.select({ id: devices.id, name: devices.name, uid: devices.uid })
		.from(devices);
	const roleTables = [
		['port', devicePort],
		['aguesguard', deviceAguesGuard],
		['game', deviceGame],
		['printer', devicePrinter],
		['light', deviceLight]
	] as const;

	const rolesByDevice = new Map<number, string[]>();
	for (const [name, table] of roleTables) {
		for (const row of await db.select({ deviceId: table.deviceId }).from(table)) {
			rolesByDevice.set(row.deviceId, [...(rolesByDevice.get(row.deviceId) ?? []), name]);
		}
	}

	const known = existingPasswords();
	const credentials: Credential[] = [];
	const rotated: string[] = [];

	for (const device of rows) {
		// A UID that is not topic-safe cannot be given an ACL at all — its topics would collide with
		// a wildcard. Better to name it here than to quietly hand it credentials that do nothing.
		if (isTopicSafeUid(device.uid) === false) {
			console.error(
				`skipping "${device.name}": uid ${JSON.stringify(device.uid)} is not topic-safe`
			);
			continue;
		}
		const password = known.get(device.uid);
		if (password == null) rotated.push(device.uid);
		credentials.push({
			uid: device.uid,
			password: password ?? newPassword(),
			roles: rolesByDevice.get(device.id) ?? []
		});
	}

	await connection.end();

	console.log('# MQTT_DEVICE_CREDENTIALS for the broker service');
	console.log(JSON.stringify(credentials));
	console.log('');
	console.log('# config.json `mqtt` block per device');
	for (const credential of credentials) {
		console.log(
			`${credential.uid}: ${JSON.stringify({ username: credential.uid, password: credential.password })}`
		);
	}
	console.log('');
	if (rotated.length === 0) console.log('# no new devices - every card in the field still works');
	else console.log(`# new credentials issued for: ${rotated.join(', ')}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
