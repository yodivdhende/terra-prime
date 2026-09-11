import { EventStatus } from '$lib/types/event-status';
import { desc, eq } from 'drizzle-orm';
import { db } from './mysql';
import { characterVersions, eventParticipants, events } from './schema';

const eventColumns = {
	id: events.id,
	name: events.name,
	start: events.startTime,
	end: events.endTime,
	status: events.status,
	budget: events.budget,
	rewardBudget: events.rewardBudget,
	formId: events.formId,
	sheetId: events.sheetId
};

type EventRow = {
	id: number;
	name: string | null;
	start: Date | null;
	end: Date | null;
	status: EventStatus | null;
	budget: number | null;
	rewardBudget: number | null;
	formId?: string | null;
	sheetId?: string | null;
};

/**
 * `Name`, `StartTime`, `EndTime`, and `Status` are all nullable in the schema but required by the
 * domain type. Rows that are missing one are dropped, which is what the old row guard did.
 */
function toLarpEvent(row: EventRow): LarpEvent | null {
	if (row.name == null || row.start == null || row.end == null || row.status == null) return null;
	return {
		id: row.id,
		name: row.name,
		start: row.start,
		end: row.end,
		status: row.status,
		budget: row.budget ?? undefined,
		rewardBudget: row.rewardBudget ?? undefined,
		formId: row.formId ?? null,
		sheetId: row.sheetId ?? null
	};
}

function toLarpEvents(rows: EventRow[]): LarpEvent[] {
	return rows.map(toLarpEvent).filter((event) => event != null);
}

class EventRepo {
	public async getAll(): Promise<LarpEvent[]> {
		return toLarpEvents(await db.select(eventColumns).from(events));
	}

	public async getWithId(id: number): Promise<LarpEvent | undefined> {
		const rows = await db.select(eventColumns).from(events).where(eq(events.id, id));
		return toLarpEvents(rows)[0];
	}

	public async getWithStatus(status: EventStatus): Promise<LarpEvent[]> {
		return toLarpEvents(
			await db.select(eventColumns).from(events).where(eq(events.status, status))
		);
	}

	/** The event with `status`, most recently started (ties broken by highest id); `undefined` if none. */
	public async getLatestWithStatus(status: EventStatus): Promise<LarpEvent | undefined> {
		const rows = await db
			.select(eventColumns)
			.from(events)
			.where(eq(events.status, status))
			.orderBy(desc(events.startTime), desc(events.id))
			.limit(1);
		return toLarpEvents(rows)[0];
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
		const [result] = await db.insert(events).values({
			name,
			startTime: start,
			endTime: end,
			status,
			budget: budget ?? null,
			rewardBudget: rewardBudget ?? null,
			formId: formId ?? null,
			sheetId: sheetId ?? null
		});
		return result.insertId ?? null;
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
		await db
			.update(events)
			.set({
				name,
				startTime: start,
				endTime: end,
				status,
				budget: budget ?? null,
				rewardBudget: rewardBudget ?? null,
				formId: formId ?? null,
				sheetId: sheetId ?? null
			})
			.where(eq(events.id, id as number));
		return id;
	}

	public async setSheetId(id: number, sheetId: string) {
		await db.update(events).set({ sheetId }).where(eq(events.id, id));
	}

	public async delete({ id }: { id: number }) {
		await db.delete(events).where(eq(events.id, id));
	}

	public async getForCharacter({ characterId }: { characterId: number }): Promise<LarpEvent[]> {
		const rows = await db
			.select(eventColumns)
			.from(events)
			.innerJoin(eventParticipants, eq(eventParticipants.eventId, events.id))
			.innerJoin(characterVersions, eq(characterVersions.id, eventParticipants.characterVersionId))
			.where(eq(characterVersions.characterId, characterId));
		return toLarpEvents(rows);
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
