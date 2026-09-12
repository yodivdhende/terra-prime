import { eq, inArray } from 'drizzle-orm';
import { DEVICE_ROLE_NAMES } from '$lib/types/device';
import type {
	Device,
	DeviceRole,
	DeviceRoleName,
	DeviceSummary,
	EditDevice,
	NewDevice
} from '$lib/types/device';
import { db } from './mysql';
import {
	characterVersions,
	deviceAguesGuard,
	deviceGame,
	deviceLight,
	devicePort,
	devicePrinter,
	devices,
	missionPrinter
} from './schema';

/**
 * The device registry.
 *
 * A device is a name and a UID; everything else about it is a role. Roles are attached and
 * detached one at a time, a device may hold several at once, and a device with none is
 * unclassified — that is legal, and is what a UID looks like before anyone has decided what the
 * hardware is for.
 *
 * A Port is the empty role: `attachRole({ role: 'port' })` writes a row with no columns beyond
 * the device id, because a Port carries no configured behaviour at all.
 */
class DeviceRepo {
	public async getAll(): Promise<Device[]> {
		const rows = await db.select().from(devices).orderBy(devices.id);
		if (rows.length === 0) return [];
		const roles = await this.getRolesForDevices(rows.map(({ id }) => id));
		return rows.map((row) => ({ ...row, roles: roles.get(row.id) ?? [] }));
	}

	public async getWithId(id: number): Promise<Device | null> {
		const [row] = await db.select().from(devices).where(eq(devices.id, id));
		if (row == null) return null;
		const roles = await this.getRolesForDevices([id]);
		return { ...row, roles: roles.get(id) ?? [] };
	}

	/** The lookup a device does for itself: it knows its UID, not its row id. */
	public async getWithUid(uid: string): Promise<Device | null> {
		const [row] = await db.select().from(devices).where(eq(devices.uid, uid));
		if (row == null) return null;
		const roles = await this.getRolesForDevices([row.id]);
		return { ...row, roles: roles.get(row.id) ?? [] };
	}

	public async create({ name, uid }: NewDevice): Promise<SaveResult> {
		if (await this.uidTaken(uid)) return { ok: false, reason: 'uid-taken' };
		const [result] = await db.insert(devices).values({ name: name.trim(), uid: uid.trim() });
		if (result.insertId == null) return { ok: false, reason: 'uid-taken' };
		return { ok: true, id: result.insertId };
	}

	public async edit({ id, name, uid }: EditDevice): Promise<SaveResult> {
		if (await this.uidTaken(uid, id)) return { ok: false, reason: 'uid-taken' };
		await db.update(devices).set({ name: name.trim(), uid: uid.trim() }).where(eq(devices.id, id));
		return { ok: true, id };
	}

	/**
	 * Role rows cascade on delete; the rows that point *at* this device from elsewhere do not, and
	 * have to go first. A Game loses the Port it was watching, and a mission loses the printer —
	 * which is exactly what wheeling the machine out of the room means, and the mission's available
	 * prints drop by that printer's share on their own.
	 */
	public async delete(id: number): Promise<void> {
		await db.transaction(async (tx) => {
			await tx.delete(deviceGame).where(eq(deviceGame.portDeviceId, id));
			await tx.delete(missionPrinter).where(eq(missionPrinter.deviceId, id));
			await tx.delete(devices).where(eq(devices.id, id));
		});
	}

	/**
	 * Attaching a role a device already holds updates it in place, so the same call serves
	 * "make this a printer" and "change how many prints it has".
	 */
	public async attachRole(deviceId: number, role: DeviceRole): Promise<AttachRoleResult> {
		const [device] = await db
			.select({ id: devices.id })
			.from(devices)
			.where(eq(devices.id, deviceId));
		if (device == null) return { ok: false, reason: 'device-not-found' };

		switch (role.role) {
			case 'port':
				await db
					.insert(devicePort)
					.values({ deviceId })
					.onDuplicateKeyUpdate({ set: { deviceId } });
				return { ok: true };
			case 'aguesguard': {
				const [version] = await db
					.select({ id: characterVersions.id })
					.from(characterVersions)
					.where(eq(characterVersions.id, role.characterVersionId));
				if (version == null) return { ok: false, reason: 'character-version-not-found' };
				await db
					.insert(deviceAguesGuard)
					.values({ deviceId, characterVersionId: role.characterVersionId })
					.onDuplicateKeyUpdate({ set: { characterVersionId: role.characterVersionId } });
				return { ok: true };
			}
			case 'game': {
				// A Game watches a Port, and the database cannot say "this id must also be in
				// Device_Port" — so the check lives here.
				if (role.portDeviceId === deviceId) return { ok: false, reason: 'port-is-self' };
				const [port] = await db
					.select({ deviceId: devicePort.deviceId })
					.from(devicePort)
					.where(eq(devicePort.deviceId, role.portDeviceId));
				if (port == null) return { ok: false, reason: 'not-a-port' };
				await db
					.insert(deviceGame)
					.values({ deviceId, portDeviceId: role.portDeviceId })
					.onDuplicateKeyUpdate({ set: { portDeviceId: role.portDeviceId } });
				return { ok: true };
			}
			case 'printer':
				await db
					.insert(devicePrinter)
					.values({ deviceId, printsAvailable: role.printsAvailable })
					.onDuplicateKeyUpdate({ set: { printsAvailable: role.printsAvailable } });
				return { ok: true };
			case 'light':
				await db
					.insert(deviceLight)
					.values({ deviceId, endpoint: role.endpoint, fixture: role.fixture })
					.onDuplicateKeyUpdate({ set: { endpoint: role.endpoint, fixture: role.fixture } });
				return { ok: true };
		}
	}

	/** Detaching a role a device does not hold is a no-op, not an error. */
	public async detachRole(deviceId: number, role: DeviceRoleName): Promise<DetachRoleResult> {
		switch (role) {
			case 'port': {
				// Dropping the Port role out from under a Game would leave that Game watching a
				// device that is no longer a Port.
				const watchers = await db
					.select({ deviceId: deviceGame.deviceId })
					.from(deviceGame)
					.where(eq(deviceGame.portDeviceId, deviceId));
				if (watchers.length > 0) return { ok: false, reason: 'port-in-use' };
				await db.delete(devicePort).where(eq(devicePort.deviceId, deviceId));
				return { ok: true };
			}
			case 'aguesguard':
				await db.delete(deviceAguesGuard).where(eq(deviceAguesGuard.deviceId, deviceId));
				return { ok: true };
			case 'game':
				await db.delete(deviceGame).where(eq(deviceGame.deviceId, deviceId));
				return { ok: true };
			case 'printer':
				await db.delete(devicePrinter).where(eq(devicePrinter.deviceId, deviceId));
				return { ok: true };
			case 'light':
				await db.delete(deviceLight).where(eq(deviceLight.deviceId, deviceId));
				return { ok: true };
		}
	}

	/** Every device holding the Port role — what a Game picks from. */
	public async getAllPorts(): Promise<DeviceSummary[]> {
		const rows = await db
			.select({ id: devices.id, name: devices.name, uid: devices.uid })
			.from(devicePort)
			.innerJoin(devices, eq(devices.id, devicePort.deviceId))
			.orderBy(devices.name);
		return rows;
	}

	private async uidTaken(uid: string, exceptId?: number): Promise<boolean> {
		const [row] = await db
			.select({ id: devices.id })
			.from(devices)
			.where(eq(devices.uid, uid.trim()));
		return row != null && row.id !== exceptId;
	}

	private async getRolesForDevices(deviceIds: number[]): Promise<Map<number, DeviceRole[]>> {
		const byDevice = new Map<number, DeviceRole[]>();
		if (deviceIds.length === 0) return byDevice;
		const add = (deviceId: number, role: DeviceRole) => {
			const existing = byDevice.get(deviceId);
			if (existing == null) byDevice.set(deviceId, [role]);
			else existing.push(role);
		};

		const [ports, aguesGuards, games, printers, lights] = await Promise.all([
			db.select().from(devicePort).where(inArray(devicePort.deviceId, deviceIds)),
			db.select().from(deviceAguesGuard).where(inArray(deviceAguesGuard.deviceId, deviceIds)),
			db.select().from(deviceGame).where(inArray(deviceGame.deviceId, deviceIds)),
			db.select().from(devicePrinter).where(inArray(devicePrinter.deviceId, deviceIds)),
			db.select().from(deviceLight).where(inArray(deviceLight.deviceId, deviceIds))
		]);

		for (const { deviceId } of ports) add(deviceId, { role: 'port' });
		for (const { deviceId, characterVersionId } of aguesGuards) {
			add(deviceId, { role: 'aguesguard', characterVersionId });
		}
		for (const { deviceId, portDeviceId } of games) add(deviceId, { role: 'game', portDeviceId });
		for (const { deviceId, printsAvailable } of printers) {
			add(deviceId, { role: 'printer', printsAvailable });
		}
		for (const { deviceId, endpoint, fixture } of lights) {
			add(deviceId, { role: 'light', endpoint, fixture });
		}
		// Stable order regardless of which query resolved first.
		for (const roles of byDevice.values()) {
			roles.sort((a, b) => DEVICE_ROLE_NAMES.indexOf(a.role) - DEVICE_ROLE_NAMES.indexOf(b.role));
		}
		return byDevice;
	}
}

export const deviceRepo = new DeviceRepo();

/** Re-exported so a server module can take the repo and the shapes from one import. */
export type {
	AguesGuardRole,
	Device,
	DeviceDraft,
	DeviceRole,
	DeviceRoleName,
	DeviceSummary,
	EditDevice,
	GameRole,
	LightRole,
	NewDevice,
	PortRole,
	PrinterRole
} from '$lib/types/device';

export type SaveResult = { ok: true; id: number } | { ok: false; reason: 'uid-taken' };

export type AttachRoleResult =
	| { ok: true }
	| {
			ok: false;
			reason: 'device-not-found' | 'character-version-not-found' | 'not-a-port' | 'port-is-self';
	  };

export type DetachRoleResult = { ok: true } | { ok: false; reason: 'port-in-use' };

export function isNewDevice(device: unknown): device is NewDevice {
	return (
		typeof device === 'object' &&
		device !== null &&
		'name' in device &&
		typeof device.name === 'string' &&
		device.name.trim().length > 0 &&
		'uid' in device &&
		typeof device.uid === 'string' &&
		device.uid.trim().length > 0
	);
}

export function isEditDevice(device: unknown): device is EditDevice {
	return isNewDevice(device) && 'id' in device && typeof device.id === 'number' && device.id > 0;
}

/**
 * Parses `body` as the payload for attaching `role`. The role name comes from the URL, so the
 * body carries only that role's own fields — `{}` for a Port.
 */
export function parseDeviceRole(role: DeviceRoleName, body: unknown): DeviceRole | null {
	if (role === 'port') return { role: 'port' };
	if (typeof body !== 'object' || body === null) return null;
	switch (role) {
		case 'aguesguard': {
			const characterVersionId = readInt(body, 'characterVersionId');
			if (characterVersionId == null || characterVersionId <= 0) return null;
			return { role: 'aguesguard', characterVersionId };
		}
		case 'game': {
			const portDeviceId = readInt(body, 'portDeviceId');
			if (portDeviceId == null || portDeviceId <= 0) return null;
			return { role: 'game', portDeviceId };
		}
		case 'printer': {
			const printsAvailable = readInt(body, 'printsAvailable');
			if (printsAvailable == null || printsAvailable < 0) return null;
			return { role: 'printer', printsAvailable };
		}
		case 'light': {
			const endpoint = readString(body, 'endpoint');
			const fixture = readString(body, 'fixture');
			if (endpoint == null || fixture == null) return null;
			return { role: 'light', endpoint, fixture };
		}
	}
}

function readInt(body: object, key: string): number | null {
	if (key in body === false) return null;
	const value = (body as Record<string, unknown>)[key];
	if (typeof value !== 'number' || Number.isInteger(value) === false) return null;
	return value;
}

function readString(body: object, key: string): string | null {
	if (key in body === false) return null;
	const value = (body as Record<string, unknown>)[key];
	if (typeof value !== 'string' || value.trim().length === 0) return null;
	return value.trim();
}
