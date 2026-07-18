import { eq, inArray } from 'drizzle-orm';
import { db } from './mysql';
import { subco, subcoMembers } from './schema';

/** Collapses the one-row-per-member join result into one `Subco` per subco id. */
function groupSubcoLines(lines: { id: number; name: string | null; member: number }[]): Subco[] {
	const subcos: Subco[] = [];
	for (const line of lines) {
		const existing = subcos.find((s) => s.id === line.id);
		if (existing) existing.members.push(line.member);
		else subcos.push({ id: line.id, name: line.name ?? '', members: [line.member] });
	}
	return subcos;
}

const subcoLineColumns = {
	id: subco.id,
	name: subco.name,
	member: subcoMembers.memberId
};

class SubcoRepo {
	public async getAll(): Promise<Subco[]> {
		const lines = await db
			.select(subcoLineColumns)
			.from(subco)
			.innerJoin(subcoMembers, eq(subcoMembers.subcoId, subco.id));
		return groupSubcoLines(lines);
	}

	public save({ id, name, members }: Subco) {
		if (id == null) return this.create({ name, members });
		return this.edit({ id, name, members });
	}

	public async create({ name, members }: Omit<Subco, 'id'>) {
		return db.transaction(async (tx) => {
			const [result] = await tx.insert(subco).values({ name });
			if (members.length === 0) return result.insertId;
			await tx
				.insert(subcoMembers)
				.values(members.map((memberId) => ({ subcoId: result.insertId, memberId })));
			return result.insertId;
		});
	}

	public async edit({ id, name, members }: Subco) {
		if (id == null) return null;
		await db.transaction(async (tx) => {
			await tx.update(subco).set({ name }).where(eq(subco.id, id));
			await tx.delete(subcoMembers).where(eq(subcoMembers.subcoId, id));
			if (members.length > 0) {
				await tx.insert(subcoMembers).values(members.map((memberId) => ({ subcoId: id, memberId })));
			}
		});
		return id;
	}

	public async delete({ id }: { id: number }) {
		await db.transaction(async (tx) => {
			await tx.delete(subcoMembers).where(eq(subcoMembers.subcoId, id));
			await tx.delete(subco).where(eq(subco.id, id));
		});
	}

	public async getForCharacter({
		characterId
	}: {
		characterId: number;
	}): Promise<Subco | undefined> {
		const subcoIds = db
			.select({ subcoId: subcoMembers.subcoId })
			.from(subcoMembers)
			.where(eq(subcoMembers.memberId, characterId));

		const lines = await db
			.select(subcoLineColumns)
			.from(subco)
			.innerJoin(subcoMembers, eq(subcoMembers.subcoId, subco.id))
			.where(inArray(subco.id, subcoIds));

		return groupSubcoLines(lines)[0];
	}
}

export const subcoRepo = new SubcoRepo();

export type Subco = {
	id: number | null;
	name: string;
	members: number[];
};

export function isSubco(subco: unknown): subco is Subco {
	return (
		typeof subco === 'object' &&
		subco != null &&
		'name' in subco &&
		typeof subco.name === 'string' &&
		'members' in subco &&
		Array.isArray(subco.members) &&
		subco.members.every((member) => typeof member === 'number' && isNaN(member) === false) &&
		'id' in subco &&
		(typeof subco.id === 'number' || subco.id === null)
	);
}
