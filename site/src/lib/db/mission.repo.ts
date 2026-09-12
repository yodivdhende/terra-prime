import { and, eq, inArray, sql, sum } from 'drizzle-orm';
import { db } from './mysql';
import {
	characterVersions,
	characters,
	devicePrinter,
	devices,
	missionParticipants,
	missionPrinter,
	missions,
	users
} from './schema';

class MissionRepo {
	public async getAll(): Promise<Mission[]> {
		const rows = await db.select().from(missions).orderBy(missions.id);
		if (rows.length === 0) return [];
		const ids = rows.map(({ id }) => id);
		const [participants, printers] = await Promise.all([
			this.getParticipantsForMissions(ids),
			this.getPrintersForMissions(ids)
		]);
		return rows.map((row) =>
			withDerivedTotals(
				toMissionRow(row),
				participants.filter(({ missionId }) => missionId === row.id),
				printers.filter(({ missionId }) => missionId === row.id)
			)
		);
	}

	public async getWithId(id: number): Promise<Mission | null> {
		const [row] = await db.select().from(missions).where(eq(missions.id, id));
		if (row == null) return null;
		const [participants, printers] = await Promise.all([
			this.getParticipantsForMissions([id]),
			this.getPrintersForMissions([id])
		]);
		return withDerivedTotals(toMissionRow(row), participants, printers);
	}

	public async create({ name, playerLimit }: NewMission): Promise<number | null> {
		const [result] = await db.insert(missions).values({ name, playerLimit: playerLimit ?? 0 });
		return result.insertId ?? null;
	}

	/** Omitting `status` leaves the mission's current status alone. */
	public async edit({ id, name, playerLimit, status }: EditMission): Promise<number> {
		await db
			.update(missions)
			.set({ name, playerLimit: playerLimit ?? 0, status: status ?? undefined })
			.where(eq(missions.id, id));
		return id;
	}

	public async delete(id: number): Promise<void> {
		await db.transaction(async (tx) => {
			await tx.delete(missionParticipants).where(eq(missionParticipants.missionId, id));
			await tx.delete(missionPrinter).where(eq(missionPrinter.missionId, id));
			await tx.delete(missions).where(eq(missions.id, id));
		});
	}

	/**
	 * A mission's print availability is derived, never stored: it is the sum of
	 * the available prints of every printer currently attached to it. Wheel a
	 * printer in or out and this number changes with no Missions row edited.
	 */
	public async getAvailablePrints(missionId: number): Promise<number> {
		const [row] = await db
			.select({ total: sum(devicePrinter.printsAvailable) })
			.from(missionPrinter)
			.innerJoin(devicePrinter, eq(devicePrinter.deviceId, missionPrinter.deviceId))
			.where(eq(missionPrinter.missionId, missionId));
		return Number(row?.total ?? 0) || 0;
	}

	public async attachPrinter({
		missionId,
		deviceId
	}: {
		missionId: number;
		deviceId: number;
	}): Promise<AttachPrinterResult> {
		const [mission] = await db
			.select({ id: missions.id })
			.from(missions)
			.where(eq(missions.id, missionId));
		if (mission == null) return { ok: false, reason: 'mission-not-found' };
		const [printer] = await db
			.select({ deviceId: devicePrinter.deviceId })
			.from(devicePrinter)
			.where(eq(devicePrinter.deviceId, deviceId));
		if (printer == null) return { ok: false, reason: 'not-a-printer' };
		await db
			.insert(missionPrinter)
			.values({ missionId, deviceId })
			.onDuplicateKeyUpdate({ set: { missionId } });
		return { ok: true };
	}

	public async detachPrinter({
		missionId,
		deviceId
	}: {
		missionId: number;
		deviceId: number;
	}): Promise<void> {
		await db
			.delete(missionPrinter)
			.where(and(eq(missionPrinter.missionId, missionId), eq(missionPrinter.deviceId, deviceId)));
	}

	/** Every printer device in the registry, attached to a mission or not. */
	public async getAllPrinters(): Promise<MissionPrinter[]> {
		const rows = await db
			.select({
				deviceId: devices.id,
				name: devices.name,
				uid: devices.uid,
				printsAvailable: devicePrinter.printsAvailable
			})
			.from(devicePrinter)
			.innerJoin(devices, eq(devices.id, devicePrinter.deviceId))
			.orderBy(devices.name);
		return rows.map(toPrinter);
	}

	/**
	 * Idempotent: registering a character version that is already on the roster
	 * succeeds without consuming a second slot. A PlayerLimit of 0 or less means
	 * no limit.
	 */
	public async registerParticipant({
		missionId,
		characterVersionId
	}: {
		missionId: number;
		characterVersionId: number;
	}): Promise<RegisterResult> {
		return db.transaction(async (tx) => {
			const [mission] = await tx
				.select({ playerLimit: missions.playerLimit, status: missions.status })
				.from(missions)
				.where(eq(missions.id, missionId))
				.for('update');
			if (mission == null) return { ok: false, reason: 'mission-not-found' };
			if (mission.status !== 'open') return { ok: false, reason: 'mission-closed' };

			const [counts] = await tx
				.select({
					total: sql<number>`count(*)`,
					alreadyRegistered: sql<number>`coalesce(sum(${missionParticipants.characterVersionId} = ${characterVersionId}), 0)`
				})
				.from(missionParticipants)
				.where(eq(missionParticipants.missionId, missionId));

			const playerLimit = Number(mission.playerLimit);
			const alreadyRegistered = Number(counts.alreadyRegistered) > 0;
			if (alreadyRegistered === false && playerLimit > 0 && Number(counts.total) >= playerLimit) {
				return { ok: false, reason: 'mission-full' };
			}

			await tx
				.insert(missionParticipants)
				.values({ missionId, characterVersionId })
				.onDuplicateKeyUpdate({ set: { missionId } });
			return { ok: true, alreadyRegistered };
		});
	}

	public async unregisterParticipant({
		missionId,
		characterVersionId
	}: {
		missionId: number;
		characterVersionId: number;
	}): Promise<void> {
		await db
			.delete(missionParticipants)
			.where(
				and(
					eq(missionParticipants.missionId, missionId),
					eq(missionParticipants.characterVersionId, characterVersionId)
				)
			);
	}

	/** Closing a mission finalizes it: no further registrations are accepted. */
	public async closeMission(missionId: number): Promise<boolean> {
		const [result] = await db
			.update(missions)
			.set({ status: 'closed' })
			.where(eq(missions.id, missionId));
		return result.affectedRows > 0;
	}

	private async getParticipantsForMissions(
		missionIds: number[]
	): Promise<(MissionParticipant & { missionId: number })[]> {
		if (missionIds.length === 0) return [];
		const rows = await db
			.select({
				missionId: missionParticipants.missionId,
				characterVersionId: missionParticipants.characterVersionId,
				availablePrints: missionParticipants.availablePrints,
				registerAt: missionParticipants.registerAt,
				characterVersionName: characterVersions.name,
				characterId: characters.id,
				characterName: characters.name,
				playerId: users.id,
				playerName: users.name
			})
			.from(missionParticipants)
			.innerJoin(
				characterVersions,
				eq(characterVersions.id, missionParticipants.characterVersionId)
			)
			.innerJoin(characters, eq(characters.id, characterVersions.characterId))
			.innerJoin(users, eq(users.id, characters.owner))
			.where(inArray(missionParticipants.missionId, missionIds))
			.orderBy(missionParticipants.registerAt);
		return rows.map((row) => ({
			missionId: row.missionId,
			characterVersionId: row.characterVersionId,
			characterVersionName: row.characterVersionName ?? null,
			characterId: row.characterId,
			characterName: row.characterName ?? null,
			playerId: row.playerId,
			playerName: row.playerName ?? '',
			availablePrints: row.availablePrints,
			registerAt: toIsoString(row.registerAt)
		}));
	}

	private async getPrintersForMissions(
		missionIds: number[]
	): Promise<(MissionPrinter & { missionId: number })[]> {
		if (missionIds.length === 0) return [];
		const rows = await db
			.select({
				missionId: missionPrinter.missionId,
				deviceId: devices.id,
				name: devices.name,
				uid: devices.uid,
				printsAvailable: devicePrinter.printsAvailable
			})
			.from(missionPrinter)
			.innerJoin(devices, eq(devices.id, missionPrinter.deviceId))
			.innerJoin(devicePrinter, eq(devicePrinter.deviceId, missionPrinter.deviceId))
			.where(inArray(missionPrinter.missionId, missionIds))
			.orderBy(devices.name);
		return rows.map((row) => ({
			missionId: row.missionId,
			...toPrinter(row)
		}));
	}
}

export const missionRepo = new MissionRepo();

export type MissionStatus = 'open' | 'closed';

export type MissionPrinter = {
	deviceId: number;
	name: string;
	uid: string;
	printsAvailable: number;
};

export type MissionParticipant = {
	characterVersionId: number;
	characterVersionName: string | null;
	characterId: number;
	characterName: string | null;
	playerId: number;
	playerName: string;
	availablePrints: number;
	registerAt: string;
};

export type Mission = {
	id: number;
	name: string;
	playerLimit: number;
	status: MissionStatus;
	createdAt: string;
	participants: MissionParticipant[];
	printers: MissionPrinter[];
	/** Derived: SUM(Device_Printer.PrintsAvailable) over `printers`. */
	availablePrints: number;
};

export type NewMission = {
	name: string;
	playerLimit: number;
};

export type EditMission = NewMission & {
	id: number;
	status?: MissionStatus;
};

/** What the manage form binds to: an unsaved mission has no id yet. */
export type MissionDraft = {
	id: number | null;
	name: string;
	playerLimit: number;
	status?: MissionStatus;
};

export type RegisterResult =
	| { ok: true; alreadyRegistered: boolean }
	| { ok: false; reason: 'mission-not-found' | 'mission-closed' | 'mission-full' };

export type AttachPrinterResult =
	| { ok: true }
	| { ok: false; reason: 'mission-not-found' | 'not-a-printer' };

export function isNewMission(mission: unknown): mission is NewMission {
	return (
		typeof mission === 'object' &&
		mission !== null &&
		'name' in mission &&
		typeof mission.name === 'string' &&
		mission.name.trim().length > 0 &&
		'playerLimit' in mission &&
		typeof mission.playerLimit === 'number' &&
		Number.isInteger(mission.playerLimit) &&
		mission.playerLimit >= 0
	);
}

export function isEditMission(mission: unknown): mission is EditMission {
	return (
		isNewMission(mission) &&
		'id' in mission &&
		typeof mission.id === 'number' &&
		('status' in mission === false ||
			mission.status === undefined ||
			mission.status === 'open' ||
			mission.status === 'closed')
	);
}

type MissionRow = Omit<Mission, 'participants' | 'printers' | 'availablePrints'>;

function toMissionRow(row: {
	id: number;
	name: string;
	playerLimit: number;
	status: MissionStatus;
	createdAt: Date;
}): MissionRow {
	return {
		id: row.id,
		name: row.name,
		playerLimit: row.playerLimit,
		status: row.status,
		createdAt: toIsoString(row.createdAt)
	};
}

function withDerivedTotals(
	mission: MissionRow,
	participants: (MissionParticipant & { missionId: number })[],
	printers: (MissionPrinter & { missionId: number })[]
): Mission {
	return {
		...mission,
		participants: participants.map(({ missionId: _missionId, ...participant }) => participant),
		printers: printers.map(({ missionId: _missionId, ...printer }) => printer),
		availablePrints: printers.reduce((total, { printsAvailable }) => total + printsAvailable, 0)
	};
}

function toPrinter(row: {
	deviceId: number;
	name: string | null;
	uid: string | null;
	printsAvailable: number;
}): MissionPrinter {
	return {
		deviceId: row.deviceId,
		name: row.name ?? '',
		uid: row.uid ?? '',
		printsAvailable: row.printsAvailable
	};
}

function toIsoString(value: unknown): string {
	if (value instanceof Date) return value.toISOString();
	if (typeof value === 'string') return value;
	return '';
}
