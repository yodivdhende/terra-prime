import { and, eq, exists, inArray, or, sql } from 'drizzle-orm';
import { db } from './mysql';
import { implantCharacterAccess, implants } from './schema';

const implantColumns = {
	id: implants.id,
	name: implants.name,
	description: implants.description,
	cost: implants.cost,
	maxCharges: implants.maxCharges,
	characterAccess: implants.characterAccess
};

class ImplantRepo {
	public async getAll(): Promise<Implant[]> {
		const rows = await db.select(implantColumns).from(implants);
		return rows.map((row) => ({ ...row, allowedCharacterIds: [] }));
	}

	public async getAllForCharacter(characterId: number): Promise<Implant[]> {
		const rows = await db
			.select(implantColumns)
			.from(implants)
			.where(
				or(
					eq(implants.characterAccess, 'all'),
					and(
						eq(implants.characterAccess, 'specific'),
						exists(
							db
								.select({ one: sql`1` })
								.from(implantCharacterAccess)
								.where(
									and(
										eq(implantCharacterAccess.implantId, implants.id),
										eq(implantCharacterAccess.characterId, characterId)
									)
								)
						)
					)
				)
			);
		return rows.map((row) => ({ ...row, allowedCharacterIds: [] }));
	}

	public async getAllAccessibleToAll(): Promise<Implant[]> {
		const rows = await db
			.select(implantColumns)
			.from(implants)
			.where(eq(implants.characterAccess, 'all'));
		return rows.map((row) => ({ ...row, allowedCharacterIds: [] }));
	}

	public async getWithId(id: number) {
		const [rows, accessRows] = await Promise.all([
			db.select(implantColumns).from(implants).where(eq(implants.id, id)),
			db
				.select({ characterId: implantCharacterAccess.characterId })
				.from(implantCharacterAccess)
				.where(eq(implantCharacterAccess.implantId, id))
		]);
		const [implant] = rows;
		if (implant == null) return null;
		return { ...implant, allowedCharacterIds: accessRows.map((row) => row.characterId) };
	}

	public async getWithIds(ids: number[]): Promise<Implant[]> {
		if (ids.length === 0) return [];
		return db.select(implantColumns).from(implants).where(inArray(implants.id, ids));
	}

	public async setCharacterAccess(
		id: number,
		access: Implant['characterAccess'],
		characterIds: number[]
	) {
		await db.transaction(async (tx) => {
			await tx
				.update(implants)
				.set({ characterAccess: access ?? 'all' })
				.where(eq(implants.id, id));
			await tx.delete(implantCharacterAccess).where(eq(implantCharacterAccess.implantId, id));
			if (access === 'specific' && characterIds.length > 0) {
				await tx
					.insert(implantCharacterAccess)
					.values(characterIds.map((characterId) => ({ implantId: id, characterId })));
			}
		});
	}

	public save(implant: Implant) {
		if (implant.id == null) return this.create(implant);
		return this.edit(implant);
	}

	public async saveBulk(items: Implant[]) {
		const toCreate = items.filter((i) => i.id == null);
		const toUpdate = items.filter((i) => i.id != null);
		await db.transaction(async (tx) => {
			if (toCreate.length > 0) {
				await tx.insert(implants).values(
					toCreate.map((i) => ({
						name: i.name,
						description: i.description,
						cost: i.cost ?? 0,
						maxCharges: i.maxCharges ?? 0
					}))
				);
			}
			if (toUpdate.length > 0) {
				await tx
					.insert(implants)
					.values(
						toUpdate.map((i) => ({
							id: i.id as number,
							name: i.name,
							description: i.description,
							cost: i.cost ?? 0,
							maxCharges: i.maxCharges ?? 0
						}))
					)
					.onDuplicateKeyUpdate({
						set: {
							name: sql`VALUES(\`Name\`)`,
							description: sql`VALUES(\`Description\`)`,
							cost: sql`VALUES(\`Cost\`)`,
							maxCharges: sql`VALUES(\`MaxCharges\`)`
						}
					});
			}
		});
	}

	public async create({ name, description, cost, maxCharges }: Omit<Implant, 'id'>) {
		const [result] = await db
			.insert(implants)
			.values({ name, description, cost: cost ?? 0, maxCharges: maxCharges ?? 0 });
		return result.insertId ?? null;
	}

	public async edit({ id, name, description, cost, maxCharges }: Implant) {
		await db
			.update(implants)
			.set({ name, description, cost: cost ?? 0, maxCharges: maxCharges ?? 0 })
			.where(eq(implants.id, id as number));
		return id;
	}

	public async delete({ id }: { id: number }) {
		await db.delete(implantCharacterAccess).where(eq(implantCharacterAccess.implantId, id));
		await db.delete(implants).where(eq(implants.id, id));
	}
}
export const implantRepo = new ImplantRepo();

export type Implant = {
	id: number | null;
	name: string;
	description: string;
	cost?: number;
	/**
	 * Charges a freshly fitted instance of this implant gets, and the ceiling an admin refresh puts
	 * it back to. `0` means this implant is not activated at all — which is every implant that
	 * existed before charges did, so the field is optional on the wire and read as 0 when absent.
	 */
	maxCharges?: number;
	characterAccess?: 'all' | 'none' | 'specific';
	allowedCharacterIds?: number[];
};

export function isImplants(implant: unknown): implant is Implant {
	return (
		typeof implant === 'object' &&
		implant !== null &&
		'name' in implant &&
		typeof implant.name === 'string' &&
		'description' in implant &&
		typeof implant.description === 'string' &&
		'id' in implant &&
		(typeof implant.id === 'number' || implant.id === null) &&
		// Optional, so absent is fine — but a present one has to be a count, because it is what a
		// refresh puts every fitted instance of this implant back to.
		('maxCharges' in implant === false ||
			implant.maxCharges == null ||
			(typeof implant.maxCharges === 'number' &&
				Number.isInteger(implant.maxCharges) &&
				implant.maxCharges >= 0))
	);
}
