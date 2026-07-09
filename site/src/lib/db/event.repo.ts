import { EventStatus } from '$lib/types/event-status';
import { dateToSqlstring } from '$lib/utils/time';
import { mysqlconnFn } from './mysql';

class EventRepo {
	public async getAll(): Promise<LarpEvent[]> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(`
              SELECT
                  Id as id,
                  Name as name,
                  StartTime as start,
                  EndTime as end,
                  Status as status,
                  Budget as budget,
                  RewardBudget as rewardBudget,
                  FormId as formId,
                  SheetId as sheetId
              FROM Events
          `);
		if (Array.isArray(result) === false) return [];
		if (result.length === 0) return [];
		const events: LarpEvent[] = [];
		for (const eventResult of result) {
			if (isLarpEvent(eventResult)) events.push(eventResult);
			else
				console.error(`%c sql result is not event`, `background:red;color:black`, {
					eventResult
				});
		}
		return events;
	}

	public async getWithId(id: number): Promise<LarpEvent | undefined> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
              SELECT
                  Id as id,
                  Name as name,
                  StartTime as start,
                  EndTime as end,
                  Status as status,
                  Budget as budget,
                  RewardBudget as rewardBudget,
                  FormId as formId,
                  SheetId as sheetId
              FROM Events
			WHERE id = ?
          `,
			[id]
		);
		if (Array.isArray(result) === false) return;
		if (result.length === 0) return;
		for (const eventResult of result) {
			if (isLarpEvent(eventResult)) return eventResult;
		}
		return;
	}

	public async getWithStatus(status: EventStatus): Promise<LarpEvent[]> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
              SELECT
                  Id as id,
                  Name as name,
                  StartTime as start,
                  EndTime as end,
                  Status as status,
                  Budget as budget,
                  RewardBudget as rewardBudget,
                  FormId as formId,
                  SheetId as sheetId
              FROM Events
							WHERE Status = ?
          `,
			[status]
		);
		if (Array.isArray(result) === false) return [];
		if (result.length === 0) return [];
		const events: LarpEvent[] = [];
		for (const eventResult of result) {
			if (isLarpEvent(eventResult)) events.push(eventResult);
			else
				console.error(`%c sql result is not event`, `background:red;color:black`, {
					eventResult
				});
		}
		return events;
	}

	public save({ id, name, start, end, status, budget, rewardBudget, formId, sheetId }: LarpEvent) {
		if (id == null)
			return this.create({ name, start, end, status, budget, rewardBudget, formId, sheetId });
		return this.edit({ id, name, start, end, status, budget, rewardBudget, formId, sheetId });
	}

	public async create({
		name,
		start,
		end,
		status,
		budget,
		rewardBudget,
		formId,
		sheetId
	}: Omit<LarpEvent, 'id'>) {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
              INSERT Events (Name, StartTime, EndTime, Status, Budget, RewardBudget, FormId, SheetId)
              VALUES (?,?,?,?,?,?,?,?)
          `,
			[
				name,
				dateToSqlstring(start),
				dateToSqlstring(end),
				status,
				budget ?? null,
				rewardBudget ?? null,
				formId ?? null,
				sheetId ?? null
			]
		);
		if ('serverStatus' in result && result.serverStatus !== 2) return null;
		if ('insertId' in result === false || result.insertId == null) return null;
		return result.insertId;
	}

	public async edit({
		id,
		name,
		start,
		end,
		status,
		budget,
		rewardBudget,
		formId,
		sheetId
	}: LarpEvent) {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
              UPDATE Events
              SET name = ?,
              StartTime = ?,
              EndTime = ?,
			Status = ?,
			Budget = ?,
			RewardBudget = ?,
			FormId = ?,
			SheetId = ?
              WHERE id = ?
          `,
			[
				name,
				dateToSqlstring(start),
				dateToSqlstring(end),
				status,
				budget ?? null,
				rewardBudget ?? null,
				formId ?? null,
				sheetId ?? null,
				id
			]
		);
		if ('serverStatus' in result && result.serverStatus !== 2) return null;
		return id;
	}

	public async setSheetId(id: number, sheetId: string) {
		const connection = mysqlconnFn();
		await connection.execute(`UPDATE Events SET SheetId = ? WHERE Id = ?`, [sheetId, id]);
	}

	public async delete({ id }: { id: number }) {
		const connection = mysqlconnFn();
		await connection.execute(
			`
              DELETE 
              FROM Events
              WHERE Id = ?
          `,
			[id]
		);
	}

	public async getForCharacter({ characterId }: { characterId: number }): Promise<LarpEvent[]> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
              SELECT
                  e.Id as id,
                  e.Name as name,
                  e.StartTime as start,
                  e.EndTime as end,
				e.Status as status,
				e.Budget as budget,
				e.RewardBudget as rewardBudget
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
		for (const eventResult of result) {
			if (isLarpEvent(eventResult)) events.push(eventResult);
			else
				console.error(`%c sql result is not event`, `background:red;color:black`, {
					eventResult
				});
		}
		return events;
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
	rewardBudget?: number;
	formId?: string | null;
	sheetId?: string | null;
};
export function isLarpEvent(event: unknown): event is LarpEvent {
	if (typeof event !== 'object' || event == null) return false;
	const hasId = 'id' in event && (event.id == null || typeof event.id === 'number');
	const hasName = 'name' in event && typeof event.name === 'string';
	const hasStart = 'start' in event && event.start instanceof Date;
	const hasEnd = 'end' in event && event.end instanceof Date;
	const hasEventStatus =
		'status' in event && (Object.values(EventStatus) as unknown[]).includes(event.status);
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
