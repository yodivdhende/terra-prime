import { mysqlconnFn } from './mysql';

export type EventCharacterBudget = {
	characterId: number;
	budget: number;
};

class EventBudgetRepo {
	public async getAllByEvent(eventId: number): Promise<EventCharacterBudget[]> {
		const connection = await mysqlconnFn();
		const [result] = await connection.execute(
			`SELECT \`Character\` as characterId, Budget as budget FROM Event_Character_Budget WHERE Event = ?`,
			[eventId]
		);
		if (!Array.isArray(result)) return [];
		return result as EventCharacterBudget[];
	}

	public async getBudgetForCharacter(eventId: number, characterId: number): Promise<number> {
		const connection = await mysqlconnFn();
		const [result] = await connection.execute(
			`SELECT Budget as budget FROM Event_Character_Budget WHERE Event = ? AND \`Character\` = ?`,
			[eventId, characterId]
		);
		if (!Array.isArray(result) || result.length === 0) return 0;
		return (result[0] as { budget: number }).budget;
	}

	public async setBudget(eventId: number, characterId: number, budget: number): Promise<void> {
		const connection = await mysqlconnFn();
		await connection.execute(
			`INSERT INTO Event_Character_Budget (Event, \`Character\`, Budget) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE Budget = ?`,
			[eventId, characterId, budget, budget]
		);
	}
}

export const eventBudgetRepo = new EventBudgetRepo();
