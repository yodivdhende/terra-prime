import { mysqlconnFn } from './mysql';

export type CharacterDiscounts = {
	characterId: number;
	items: { itemId: number; discount: number }[];
	implants: { implantId: number; discount: number }[];
	skills: { skillId: number; discount: number }[];
};

class EventDiscountsRepo {
	public async getAllByEvent(eventId: number): Promise<CharacterDiscounts[]> {
		const connection = await mysqlconnFn();

		const [items] = await connection.execute(
			`SELECT Character as characterId, Item as itemId, Discount as discount
       FROM Event_Character_Discounts_Items WHERE Event = ?`,
			[eventId]
		);
		const [implants] = await connection.execute(
			`SELECT Character as characterId, Implant as implantId, Discount as discount
       FROM Event_Character_Discounts_Implants WHERE Event = ?`,
			[eventId]
		);
		const [skills] = await connection.execute(
			`SELECT Character as characterId, Skill as skillId, Discount as discount
       FROM Event_Character_Discounts_Skills WHERE Event = ?`,
			[eventId]
		);

		const map = new Map<number, CharacterDiscounts>();

		const ensureCharacter = (characterId: number) => {
			if (!map.has(characterId)) {
				map.set(characterId, { characterId, items: [], implants: [], skills: [] });
			}
			return map.get(characterId)!;
		};

		if (Array.isArray(items)) {
			for (const row of items as { characterId: number; itemId: number; discount: number }[]) {
				ensureCharacter(row.characterId).items.push({ itemId: row.itemId, discount: row.discount });
			}
		}
		if (Array.isArray(implants)) {
			for (const row of implants as {
				characterId: number;
				implantId: number;
				discount: number;
			}[]) {
				ensureCharacter(row.characterId).implants.push({
					implantId: row.implantId,
					discount: row.discount
				});
			}
		}
		if (Array.isArray(skills)) {
			for (const row of skills as { characterId: number; skillId: number; discount: number }[]) {
				ensureCharacter(row.characterId).skills.push({
					skillId: row.skillId,
					discount: row.discount
				});
			}
		}

		return Array.from(map.values());
	}

	public async getByEventAndCharacter(
		eventId: number,
		characterId: number
	): Promise<CharacterDiscounts> {
		const connection = await mysqlconnFn();

		const [items] = await connection.execute(
			`SELECT Item as itemId, Discount as discount FROM Event_Character_Discounts_Items
       WHERE Event = ? AND Character = ?`,
			[eventId, characterId]
		);
		const [implants] = await connection.execute(
			`SELECT Implant as implantId, Discount as discount FROM Event_Character_Discounts_Implants
       WHERE Event = ? AND Character = ?`,
			[eventId, characterId]
		);
		const [skills] = await connection.execute(
			`SELECT Skill as skillId, Discount as discount FROM Event_Character_Discounts_Skills
       WHERE Event = ? AND Character = ?`,
			[eventId, characterId]
		);

		return {
			characterId,
			items: Array.isArray(items) ? (items as { itemId: number; discount: number }[]) : [],
			implants: Array.isArray(implants)
				? (implants as { implantId: number; discount: number }[])
				: [],
			skills: Array.isArray(skills) ? (skills as { skillId: number; discount: number }[]) : []
		};
	}

	public async setDiscounts(
		eventId: number,
		characterId: number,
		discounts: Omit<CharacterDiscounts, 'characterId'>
	): Promise<void> {
		const connection = await mysqlconnFn();
		await connection.beginTransaction();
		try {
			await connection.execute(
				`DELETE FROM Event_Character_Discounts_Items WHERE Event = ? AND Character = ?`,
				[eventId, characterId]
			);
			await connection.execute(
				`DELETE FROM Event_Character_Discounts_Implants WHERE Event = ? AND Character = ?`,
				[eventId, characterId]
			);
			await connection.execute(
				`DELETE FROM Event_Character_Discounts_Skills WHERE Event = ? AND Character = ?`,
				[eventId, characterId]
			);

			for (const { itemId, discount } of discounts.items) {
				await connection.execute(
					`INSERT INTO Event_Character_Discounts_Items (Event, Character, Item, Discount) VALUES (?, ?, ?, ?)`,
					[eventId, characterId, itemId, discount]
				);
			}
			for (const { implantId, discount } of discounts.implants) {
				await connection.execute(
					`INSERT INTO Event_Character_Discounts_Implants (Event, Character, Implant, Discount) VALUES (?, ?, ?, ?)`,
					[eventId, characterId, implantId, discount]
				);
			}
			for (const { skillId, discount } of discounts.skills) {
				await connection.execute(
					`INSERT INTO Event_Character_Discounts_Skills (Event, Character, Skill, Discount) VALUES (?, ?, ?, ?)`,
					[eventId, characterId, skillId, discount]
				);
			}

			await connection.commit();
		} catch (err) {
			await connection.rollback();
			throw err;
		}
	}
}

export const eventDiscountsRepo = new EventDiscountsRepo();

export function isCharacterDiscountsBody(
	obj: unknown
): obj is Omit<CharacterDiscounts, 'characterId'> {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'items' in obj &&
		Array.isArray(obj.items) &&
		'implants' in obj &&
		Array.isArray(obj.implants) &&
		'skills' in obj &&
		Array.isArray(obj.skills)
	);
}
