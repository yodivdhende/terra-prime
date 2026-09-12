/**
 * The shape of a device and its roles.
 *
 * Separate from `$lib/db/device.repo.ts` because the manage form needs `DEVICE_ROLE_NAMES` as a
 * *value* to render one checkbox per role, and importing that from the repo would pull Drizzle
 * and `mysql2` into the browser bundle. Types alone would have been fine to import — this list
 * is not.
 */
export const DEVICE_ROLE_NAMES = ['port', 'aguesguard', 'game', 'printer', 'light'] as const;

export type DeviceRoleName = (typeof DEVICE_ROLE_NAMES)[number];

/** A Port has no fields: being one is the whole of it. */
export type PortRole = { role: 'port' };
export type AguesGuardRole = { role: 'aguesguard'; characterVersionId: number };
export type GameRole = { role: 'game'; portDeviceId: number };
export type PrinterRole = { role: 'printer'; printsAvailable: number };
export type LightRole = { role: 'light'; endpoint: string; fixture: string };

export type DeviceRole = PortRole | AguesGuardRole | GameRole | PrinterRole | LightRole;

export type DeviceSummary = {
	id: number;
	name: string;
	uid: string;
};

export type Device = DeviceSummary & {
	/** Empty means unclassified, which is a legal state. */
	roles: DeviceRole[];
};

export type NewDevice = {
	name: string;
	uid: string;
};

export type EditDevice = NewDevice & { id: number };

/** What the manage form binds to: an unsaved device has no id yet. */
export type DeviceDraft = {
	id: number | null;
	name: string;
	uid: string;
	roles: DeviceRole[];
};

export function isDeviceRoleName(value: unknown): value is DeviceRoleName {
	return typeof value === 'string' && (DEVICE_ROLE_NAMES as readonly string[]).includes(value);
}
