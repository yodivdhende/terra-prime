import { and, eq, exists, inArray, or, sql } from 'drizzle-orm';
import { db } from './mysql';
import { itemCharacterAccess, items } from './schema';

const itemColumns = {
	id: items.id,
	name: items.name,
	description: items.description,
	cost: items.cost,
	maxPerCharacter: items.maxPerCharacter,
	characterAccess: items.characterAccess
};

class ItemRepo {
	public async getAll(): Promise<Item[]> {
		const rows = await db.select(itemColumns).from(items);
		return rows.map((row) => ({ ...row, allowedCharacterIds: [] }));
	}

	public async getAllForCharacter(characterId: number): Promise<Item[]> {
		const rows = await db
			.select(itemColumns)
			.from(items)
			.where(
				or(
					eq(items.characterAccess, 'all'),
					and(
						eq(items.characterAccess, 'specific'),
						exists(
							db
								.select({ one: sql`1` })
								.from(itemCharacterAccess)
								.where(
									and(
										eq(itemCharacterAccess.itemId, items.id),
										eq(itemCharacterAccess.characterId, characterId)
									)
								)
						)
					)
				)
			);
		return rows.map((row) => ({ ...row, allowedCharacterIds: [] }));
	}

	public async getAllAccessibleToAll(): Promise<Item[]> {
		const rows = await db.select(itemColumns).from(items).where(eq(items.characterAccess, 'all'));
		return rows.map((row) => ({ ...row, allowedCharacterIds: [] }));
	}

	public async getWithId(id: number) {
		const [rows, accessRows] = await Promise.all([
			db.select(itemColumns).from(items).where(eq(items.id, id)),
			db
				.select({ characterId: itemCharacterAccess.characterId })
				.from(itemCharacterAccess)
				.where(eq(itemCharacterAccess.itemId, id))
		]);
		const [item] = rows;
		if (item == null) return null;
		return { ...item, allowedCharacterIds: accessRows.map((row) => row.characterId) };
	}

	public async getWithIds(ids: number[]): Promise<Item[]> {
		if (ids.length === 0) return [];
		const rows = await db.select(itemColumns).from(items).where(inArray(items.id, ids));
		return rows.map((row) => ({ ...row, allowedCharacterIds: [] }));
	}

	public async setCharacterAccess(
		id: number,
		access: Item['characterAccess'],
		characterIds: number[]
	) {
		await db.transaction(async (tx) => {
			await tx
				.update(items)
				.set({ characterAccess: access ?? 'all' })
				.where(eq(items.id, id));
			await tx.delete(itemCharacterAccess).where(eq(itemCharacterAccess.itemId, id));
			if (access === 'specific' && characterIds.length > 0) {
				await tx
					.insert(itemCharacterAccess)
					.values(characterIds.map((characterId) => ({ itemId: id, characterId })));
			}
		});
	}

	public save(item: Item) {
		if (item.id == null) return this.create(item);
		return this.edit(item);
	}

	public async saveBulk(rows: Item[]) {
		const toCreate = rows.filter((i) => i.id == null);
		const toUpdate = rows.filter((i) => i.id != null);
		await db.transaction(async (tx) => {
			if (toCreate.length > 0) {
				await tx.insert(items).values(
					toCreate.map((i) => ({
						name: i.name,
						description: i.description,
						cost: i.cost ?? 0,
						maxPerCharacter: i.maxPerCharacter ?? null
					}))
				);
			}
			if (toUpdate.length > 0) {
				await tx
					.insert(items)
					.values(
						toUpdate.map((i) => ({
							id: i.id as number,
							name: i.name,
							description: i.description,
							cost: i.cost ?? 0,
							maxPerCharacter: i.maxPerCharacter ?? null
						}))
					)
					.onDuplicateKeyUpdate({
						set: {
							name: sql`VALUES(\`Name\`)`,
							description: sql`VALUES(\`Description\`)`,
							cost: sql`VALUES(\`Cost\`)`,
							maxPerCharacter: sql`VALUES(\`MaxPerCharacter\`)`
						}
					});
			}
		});
	}

	public async create({ name, description, cost, maxPerCharacter }: Omit<Item, 'id'>) {
		const [result] = await db.insert(items).values({
			name,
			description,
			cost: cost ?? 0,
			maxPerCharacter: maxPerCharacter ?? null
		});
		return result.insertId ?? null;
	}

	public async edit({ id, name, description, cost, maxPerCharacter }: Item) {
		await db
			.update(items)
			.set({
				name,
				description,
				cost: cost ?? 0,
				maxPerCharacter: maxPerCharacter ?? null
			})
			.where(eq(items.id, id as number));
		return id;
	}

	public async delete({ id }: { id: number }) {
		await db.delete(itemCharacterAccess).where(eq(itemCharacterAccess.itemId, id));
		await db.delete(items).where(eq(items.id, id));
	}
}
export const itemRepo = new ItemRepo();

export type Item = {
	id: number | null;
	name: string;
	description: string;
	cost?: number;
	maxPerCharacter?: number | null;
	characterAccess?: 'all' | 'none' | 'specific';
	allowedCharacterIds?: number[];
};

export function isItem(item: unknown): item is Item {
	return (
		typeof item === 'object' &&
		item !== null &&
		'name' in item &&
		typeof item.name === 'string' &&
		'description' in item &&
		typeof item.description === 'string' &&
		'id' in item &&
		(typeof item.id === 'number' || item.id === null)
	);
}
