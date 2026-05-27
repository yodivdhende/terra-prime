import { EventStatus } from '$lib/types/event-status';
import { dateToSqlstring } from '$lib/utils/time';
import { mysqlconnFn } from './mysql';

class EventRepo {
	public async getAll(): Promise<LarpEvent[]> {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(`
                SELECT
                    Id as id,
                    Name as name,
                    StartTime as start,
                    EndTime as end,
                    Status as status,
                    Budget as budget
                FROM Events
            `);
			if (Array.isArray(result) === false) return [];
			if (result.length === 0) return [];
			const events: LarpEvent[] = [];
			for (let eventResult of result) {
				if (isLarpEvent(eventResult)) events.push(eventResult);
				else
					console.error(`%c sql result is not event`, `background:red;color:black`, {
						eventResult
					});
			}
			return events;
		} catch (err) {
			throw err;
		}
	}

	public async getWithId(id: number): Promise<LarpEvent | undefined> {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
                SELECT
                    Id as id,
                    Name as name,
                    StartTime as start,
                    EndTime as end,
                    Status as status,
                    Budget as budget
                FROM Events
				WHERE id = ?
            `,
				[id]
			);
			if (Array.isArray(result) === false) return;
			if (result.length === 0) return;
			for (let eventResult of result) {
				if (isLarpEvent(eventResult)) return eventResult;
			}
			return;
		} catch (err) {
			throw err;
		}
	}

	public async getWithStatus(status: EventStatus): Promise<LarpEvent[]> {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(`
                SELECT
                    Id as id,
                    Name as name,
                    StartTime as start,
                    EndTime as end,
                    Status as status,
                    Budget as budget
                FROM Events
								WHERE Status = ?
            `, [status]);
			if (Array.isArray(result) === false) return [];
			if (result.length === 0) return [];
			const events: LarpEvent[] = [];
			for (let eventResult of result) {
				if (isLarpEvent(eventResult)) events.push(eventResult);
				else
					console.error(`%c sql result is not event`, `background:red;color:black`, {
						eventResult
					});
			}
			return events;
		} catch (err) {
			throw err;
		}
	}

	public save({ id, name, start, end, status, budget }: LarpEvent) {
		if (id == null) return this.create({ name, start, end, status, budget });
		return this.edit({ id, name, start, end, status, budget });
	}

	public async create({ name, start, end, status, budget }: Omit<LarpEvent, 'id'>) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
                INSERT Events (Name, StartTime, EndTime, Status, Budget)
                VALUES (?,?,?,?,?)
            `,
				[name, dateToSqlstring(start), dateToSqlstring(end), status, budget ?? null]
			);
			if ('serverStatus' in result && result.serverStatus !== 2) return null;
			if ('insertId' in result === false || result.insertId == null) return null;
			return result.insertId;
		} catch (err) {
			throw err;
		}
	}

	public async edit({ id, name, start, end, status, budget }: LarpEvent) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
                UPDATE Events
                SET name = ?,
                StartTime = ?,
                EndTime = ?,
				Status = ?,
				Budget = ?
                WHERE id = ?
            `,
				[name, dateToSqlstring(start), dateToSqlstring(end), status, budget ?? null, id]
			);
			if ('serverStatus' in result && result.serverStatus !== 2) return null;
			return id;
		} catch (err) {
			throw err;
		}
	}

	public async delete({ id }: { id: number }) {
		try {
			const connection = mysqlconnFn();
			await connection.execute(
				`
                DELETE 
                FROM Events
                WHERE Id = ?
            `,
				[id]
			);
		} catch (err) {
			throw err;
		}
	}

	public async getForCharacter({ characterId }: { characterId: number }): Promise<LarpEvent[]> {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
                SELECT
                    e.Id as id,
                    e.Name as name,
                    e.StartTime as start,
                    e.EndTime as end,
					e.Status as status
                FROM Events e
                JOIN Event_Participants ep
                    on ep.event = e.id
                WHERE ep.CharacterId = ?
            `,
				[characterId]
			);
			if (Array.isArray(result) === false) return [];
			if (result.length === 0) return [];
			const events: LarpEvent[] = [];
			for (let eventResult of result) {
				if (isLarpEvent(eventResult)) events.push(eventResult);
				else
					console.error(`%c sql result is not event`, `background:red;color:black`, {
						eventResult
					});
			}
			return events;
		} catch (err) {
			throw err;
		}
	}


}

export const eventRepo = new EventRepo();

export type LarpEvent = {
	id: number | null;
	name: string;
	start: Date;
	end: Date;
	status: EventStatus;
	budget?: number;
};
export function isLarpEvent(event: unknown): event is LarpEvent {
	if (typeof event !== 'object' || event == null) return false;
	const hasId = 'id' in event && (event.id == null || typeof event.id === 'number');
	const hasName = 'name' in event && typeof event.name === 'string';
	const hasStart = 'start' in event && event.start instanceof Date;
	const hasEnd = 'end' in event && event.end instanceof Date;
	const hasEventStatus =
		'status' in event && Object.values(EventStatus).includes(event.status as any);
	return hasId && hasName && hasStart && hasEnd && hasEventStatus;
}
export type StringLarpEvent = Omit<LarpEvent, 'start' | 'end'> & {
	start: string;
	end: string;
};
export function isStringLarpEvent(event: unknown): event is StringLarpEvent {
	if (typeof event !== 'object' || event == null) return false;
	const hasId = 'id' in event && (event.id == null || typeof event.id === 'number');
	const hasName = 'name' in event && typeof event.name === 'string';
	const hasStart = 'start' in event && typeof event.start === 'string';
	const hasEnd = 'end' in event && typeof event.end === 'string';
	return hasId && hasName && hasStart && hasEnd;
}
