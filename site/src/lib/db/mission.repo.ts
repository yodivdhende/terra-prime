import type { RowDataPacket } from 'mysql2/promise';
import { mysqlconnFn } from './mysql';

class MissionRepo {
	public async getAll(): Promise<Mission[]> {
		const connection = mysqlconnFn();
		const [rows] = await connection.execute(
			`
      SELECT
        m.Id as id,
        m.Name as name,
        m.PlayerLimit as playerLimit,
        m.Status as status,
        m.CreatedAt as createdAt
      FROM Missions m
      ORDER BY m.Id
      `
		);
		if (Array.isArray(rows) === false || rows.length === 0) return [];
		const ids = (rows as RowDataPacket[])
			.map(({ id }) => id)
			.filter((id): id is number => typeof id === 'number');
		const [participants, printers] = await Promise.all([
			this.getParticipantsForMissions(ids),
			this.getPrintersForMissions(ids)
		]);
		const missions: Mission[] = [];
		for (const row of rows as RowDataPacket[]) {
			const mission = toMissionRow(row);
			if (mission == null) continue;
			missions.push(
				withDerivedTotals(
					mission,
					participants.filter(({ missionId }) => missionId === mission.id),
					printers.filter(({ missionId }) => missionId === mission.id)
				)
			);
		}
		return missions;
	}

	public async getWithId(id: number): Promise<Mission | null> {
		const connection = mysqlconnFn();
		const [rows] = await connection.execute(
			`
      SELECT
        m.Id as id,
        m.Name as name,
        m.PlayerLimit as playerLimit,
        m.Status as status,
        m.CreatedAt as createdAt
      FROM Missions m
      WHERE m.Id = ?
      `,
			[id]
		);
		if (Array.isArray(rows) === false || rows.length === 0) return null;
		const mission = toMissionRow(rows[0] as RowDataPacket);
		if (mission == null) return null;
		const [participants, printers] = await Promise.all([
			this.getParticipantsForMissions([id]),
			this.getPrintersForMissions([id])
		]);
		return withDerivedTotals(mission, participants, printers);
	}

	public async create({ name, playerLimit }: NewMission): Promise<number | null> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
      INSERT INTO Missions (Name, PlayerLimit)
      VALUES (?, ?)
      `,
			[name, playerLimit ?? 0]
		);
		if ('insertId' in result === false || result.insertId == null) return null;
		return result.insertId;
	}

	/** Omitting `status` leaves the mission's current status alone. */
	public async edit({ id, name, playerLimit, status }: EditMission): Promise<number> {
		const connection = mysqlconnFn();
		await connection.execute(
			`
      UPDATE Missions
      SET Name = ?,
          PlayerLimit = ?,
          Status = COALESCE(?, Status)
      WHERE Id = ?
      `,
			[name, playerLimit ?? 0, status ?? null, id]
		);
		return id;
	}

	public async delete(id: number): Promise<void> {
		const conn = await mysqlconnFn().getConnection();
		try {
			await conn.beginTransaction();
			await conn.execute(`DELETE FROM Mission_Participants WHERE Mission = ?`, [id]);
			await conn.execute(`DELETE FROM Mission_Printer WHERE Mission = ?`, [id]);
			await conn.execute(`DELETE FROM Missions WHERE Id = ?`, [id]);
			await conn.commit();
		} catch (err) {
			await conn.rollback();
			throw err;
		} finally {
			conn.release();
		}
	}

	/**
	 * A mission's print availability is derived, never stored: it is the sum of
	 * the available prints of every printer currently attached to it. Wheel a
	 * printer in or out and this number changes with no Missions row edited.
	 */
	public async getAvailablePrints(missionId: number): Promise<number> {
		const connection = mysqlconnFn();
		const [rows] = await connection.execute(
			`
      SELECT COALESCE(SUM(dp.PrintsAvailable), 0) as total
      FROM Mission_Printer mp
      JOIN Device_Printer dp ON dp.Device = mp.Device
      WHERE mp.Mission = ?
      `,
			[missionId]
		);
		if (Array.isArray(rows) === false || rows.length === 0) return 0;
		return Number((rows[0] as { total: number }).total) || 0;
	}

	public async attachPrinter({
		missionId,
		deviceId
	}: {
		missionId: number;
		deviceId: number;
	}): Promise<AttachPrinterResult> {
		const connection = mysqlconnFn();
		const [missionRows] = await connection.execute(`SELECT Id FROM Missions WHERE Id = ?`, [
			missionId
		]);
		if (Array.isArray(missionRows) === false || missionRows.length === 0)
			return { ok: false, reason: 'mission-not-found' };
		const [printerRows] = await connection.execute(
			`SELECT Device FROM Device_Printer WHERE Device = ?`,
			[deviceId]
		);
		if (Array.isArray(printerRows) === false || printerRows.length === 0)
			return { ok: false, reason: 'not-a-printer' };
		await connection.execute(
			`
      INSERT INTO Mission_Printer (Mission, Device)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE Mission = Mission
      `,
			[missionId, deviceId]
		);
		return { ok: true };
	}

	public async detachPrinter({
		missionId,
		deviceId
	}: {
		missionId: number;
		deviceId: number;
	}): Promise<void> {
		const connection = mysqlconnFn();
		await connection.execute(`DELETE FROM Mission_Printer WHERE Mission = ? AND Device = ?`, [
			missionId,
			deviceId
		]);
	}

	/** Every printer device in the registry, attached to a mission or not. */
	public async getAllPrinters(): Promise<MissionPrinter[]> {
		const connection = mysqlconnFn();
		const [rows] = await connection.execute(
			`
      SELECT
        d.Id as deviceId,
        d.Name as name,
        d.Uid as uid,
        dp.PrintsAvailable as printsAvailable
      FROM Device_Printer dp
      JOIN Devices d ON d.Id = dp.Device
      ORDER BY d.Name
      `
		);
		if (Array.isArray(rows) === false) return [];
		return (rows as RowDataPacket[]).map(toPrinter);
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
		const conn = await mysqlconnFn().getConnection();
		try {
			await conn.beginTransaction();
			const [missionRows] = await conn.execute(
				`SELECT Id, PlayerLimit, Status FROM Missions WHERE Id = ? FOR UPDATE`,
				[missionId]
			);
			if (Array.isArray(missionRows) === false || missionRows.length === 0) {
				await conn.rollback();
				return { ok: false, reason: 'mission-not-found' };
			}
			const mission = missionRows[0] as { PlayerLimit: number; Status: MissionStatus };
			if (mission.Status !== 'open') {
				await conn.rollback();
				return { ok: false, reason: 'mission-closed' };
			}
			const [countRows] = await conn.execute(
				`
        SELECT
          COUNT(*) as total,
          COALESCE(SUM(CharacterVersion = ?), 0) as alreadyRegistered
        FROM Mission_Participants
        WHERE Mission = ?
        `,
				[characterVersionId, missionId]
			);
			const counts = (countRows as RowDataPacket[])[0] as {
				total: number;
				alreadyRegistered: number;
			};
			const playerLimit = Number(mission.PlayerLimit);
			const alreadyRegistered = Number(counts.alreadyRegistered) > 0;
			if (alreadyRegistered === false && playerLimit > 0 && Number(counts.total) >= playerLimit) {
				await conn.rollback();
				return { ok: false, reason: 'mission-full' };
			}
			await conn.execute(
				`
        INSERT INTO Mission_Participants (Mission, CharacterVersion)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE Mission = Mission
        `,
				[missionId, characterVersionId]
			);
			await conn.commit();
			return { ok: true, alreadyRegistered };
		} catch (err) {
			await conn.rollback();
			throw err;
		} finally {
			conn.release();
		}
	}

	public async unregisterParticipant({
		missionId,
		characterVersionId
	}: {
		missionId: number;
		characterVersionId: number;
	}): Promise<void> {
		const connection = mysqlconnFn();
		await connection.execute(
			`DELETE FROM Mission_Participants WHERE Mission = ? AND CharacterVersion = ?`,
			[missionId, characterVersionId]
		);
	}

	/** Closing a mission finalizes it: no further registrations are accepted. */
	public async closeMission(missionId: number): Promise<boolean> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`UPDATE Missions SET Status = 'closed' WHERE Id = ?`,
			[missionId]
		);
		if ('affectedRows' in result === false) return false;
		return Number(result.affectedRows) > 0;
	}

	private async getParticipantsForMissions(
		missionIds: number[]
	): Promise<(MissionParticipant & { missionId: number })[]> {
		if (missionIds.length === 0) return [];
		const connection = mysqlconnFn();
		const placeholders = missionIds.map(() => '?').join(',');
		const [rows] = await connection.execute(
			`
      SELECT
        mp.Mission as missionId,
        mp.CharacterVersion as characterVersionId,
        mp.AvailablePrints as availablePrints,
        mp.RegisterAt as registerAt,
        cv.Name as characterVersionName,
        c.Id as characterId,
        c.Name as characterName,
        u.Id as playerId,
        u.Name as playerName
      FROM Mission_Participants mp
      JOIN Character_Versions cv ON cv.Id = mp.CharacterVersion
      JOIN Characters c ON c.Id = cv.\`Character\`
      JOIN Users u ON u.Id = c.Owner
      WHERE mp.Mission IN (${placeholders})
      ORDER BY mp.RegisterAt
      `,
			missionIds
		);
		if (Array.isArray(rows) === false) return [];
		return (rows as RowDataPacket[]).map((row) => ({
			missionId: Number(row.missionId),
			characterVersionId: Number(row.characterVersionId),
			characterVersionName: row.characterVersionName ?? null,
			characterId: Number(row.characterId),
			characterName: row.characterName ?? null,
			playerId: Number(row.playerId),
			playerName: row.playerName ?? '',
			availablePrints: Number(row.availablePrints) || 0,
			registerAt: toIsoString(row.registerAt)
		}));
	}

	private async getPrintersForMissions(
		missionIds: number[]
	): Promise<(MissionPrinter & { missionId: number })[]> {
		if (missionIds.length === 0) return [];
		const connection = mysqlconnFn();
		const placeholders = missionIds.map(() => '?').join(',');
		const [rows] = await connection.execute(
			`
      SELECT
        mp.Mission as missionId,
        d.Id as deviceId,
        d.Name as name,
        d.Uid as uid,
        dp.PrintsAvailable as printsAvailable
      FROM Mission_Printer mp
      JOIN Devices d ON d.Id = mp.Device
      JOIN Device_Printer dp ON dp.Device = mp.Device
      WHERE mp.Mission IN (${placeholders})
      ORDER BY d.Name
      `,
			missionIds
		);
		if (Array.isArray(rows) === false) return [];
		return (rows as RowDataPacket[]).map((row) => ({
			missionId: Number(row.missionId),
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

function toMissionRow(row: RowDataPacket): MissionRow | null {
	if (typeof row.id !== 'number') return null;
	if (typeof row.name !== 'string') return null;
	if (row.status !== 'open' && row.status !== 'closed') return null;
	return {
		id: row.id,
		name: row.name,
		playerLimit: Number(row.playerLimit) || 0,
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

function toPrinter(row: RowDataPacket): MissionPrinter {
	return {
		deviceId: Number(row.deviceId),
		name: typeof row.name === 'string' ? row.name : '',
		uid: typeof row.uid === 'string' ? row.uid : '',
		printsAvailable: Number(row.printsAvailable) || 0
	};
}

function toIsoString(value: unknown): string {
	if (value instanceof Date) return value.toISOString();
	if (typeof value === 'string') return value;
	return '';
}
