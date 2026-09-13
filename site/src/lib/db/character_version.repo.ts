import { and, eq, gt, inArray, sql } from 'drizzle-orm';
import { db } from './mysql';
import {
	characterVersionExpertise,
	characterVersionImplants,
	characterVersionItems,
	characterVersions,
	characters,
	implants,
	users
} from './schema';
import { eventParticipantsRepo } from './event_participants.repo';

/**
 * Children are loaded with one query per child table, then attached in memory — the same shape the
 * pre-Drizzle code used. Drizzle's relational query API (`db.query.characterVersions.findMany`) was
 * evaluated for this and rejected: for MySQL it compiles to `LEFT JOIN LATERAL` + `json_arrayagg`,
 * which needs MySQL 8.0.14+ and is rejected outright by MariaDB. Three indexed `IN (...)` lookups
 * are portable and keep the emitted SQL close to what this repository issued before.
 */
type VersionRow = {
	id: number;
	characterId: number;
	name: string | null;
	companyId: number;
};

type LoadedVersion = VersionRow & {
	items: { itemId: number | null; count: number | null }[];
	implants: { implantId: number | null; slot: number; chargesRemaining: number }[];
	expertise: { expertiseId: number | null; value: number | null }[];
};

const versionColumns = {
	id: characterVersions.id,
	characterId: characterVersions.characterId,
	name: characterVersions.name,
	companyId: characterVersions.companyId
};

/**
 * `Character_Versions.Name` is nullable and the child link columns are too. Rows missing one are
 * dropped, matching the runtime guards this repository used before the Drizzle port.
 */
function toBare(row: LoadedVersion): CharacterVersionBare | null {
	if (row.name == null) return null;
	return {
		id: row.id,
		characterId: row.characterId,
		name: row.name,
		company: row.companyId,
		expertise: row.expertise
			.filter((e) => e.expertiseId != null && e.value != null)
			.map((e) => ({ id: e.expertiseId as number, value: e.value as number })),
		items: row.items
			.filter((i) => i.itemId != null && i.count != null)
			.map((i) => ({ id: i.itemId as number, count: i.count as number })),
		implants: row.implants
			.filter((i) => i.implantId != null)
			.map((i) => ({
				id: i.implantId as number,
				slot: i.slot,
				chargesRemaining: i.chargesRemaining
			}))
	};
}

/** As `toBare`, but collapsing duplicate children: first wins for expertise and implants, counts sum for items. */
function toBareDeduped(row: LoadedVersion): CharacterVersionBare | null {
	const bare = toBare(row);
	if (bare == null) return null;
	return {
		...bare,
		expertise: bare.expertise.reduce((acc, entry) => {
			if (!acc.some((e) => e.id === entry.id)) acc.push(entry);
			return acc;
		}, [] as CharacterVersionExpertise[]),
		items: bare.items.reduce((acc, entry) => {
			const existing = acc.find((i) => i.id === entry.id);
			if (existing) existing.count += entry.count;
			else acc.push({ ...entry });
			return acc;
		}, [] as CharacterVersionItem[]),
		implants: bare.implants.reduce((acc, entry) => {
			if (!acc.some((i) => i.id === entry.id)) acc.push(entry);
			return acc;
		}, [] as CharacterVersionImplant[])
	};
}

function collect(
	rows: LoadedVersion[],
	map: (row: LoadedVersion) => CharacterVersionBare | null
): CharacterVersionBare[] {
	return rows.map(map).filter((version) => version != null);
}

class CharacterVersionRepo {
	/** One lookup per child table for the whole page of versions, then grouped by version id. */
	private async attachChildren(rows: VersionRow[]): Promise<LoadedVersion[]> {
		const ids = rows.map((row) => row.id);
		const [items, implants, expertise] = await Promise.all([
			this.getItemsforCharacterVersions(ids),
			this.getImplantsforCharacterVersions(ids),
			this.getExpertiseForCharacterVersions(ids)
		]);
		return rows.map((row) => ({
			...row,
			items: items.filter((child) => child.characterVersionId === row.id),
			implants: implants.filter((child) => child.characterVersionId === row.id),
			expertise: expertise.filter((child) => child.characterVersionId === row.id)
		}));
	}

	public async getAll(): Promise<CharacterVersionBare[]> {
		const rows = await db.select(versionColumns).from(characterVersions);
		return collect(await this.attachChildren(rows), toBare);
	}

	public save(characterVersion: CharacterVersionBare): Promise<number> {
		if (characterVersion.id != null) return this.update(characterVersion);
		return this.create(characterVersion);
	}

	public async create(characterVersion: CharacterVersionBare): Promise<number> {
		const [result] = await db.insert(characterVersions).values({
			characterId: characterVersion.characterId,
			name: characterVersion.name,
			companyId: characterVersion.company
		});
		const versionId = result.insertId;
		await Promise.all([
			this.saveExpertise({ versionId, expertise: characterVersion.expertise }),
			this.saveItems({ versionId, items: characterVersion.items }),
			this.saveImplants({ versionId, implants: characterVersion.implants })
		]);
		return versionId;
	}

	public async update(characterVersion: CharacterVersionBare): Promise<number> {
		if (characterVersion.id == null) throw new Error('update requires an id');
		const versionId = characterVersion.id;
		await db
			.update(characterVersions)
			.set({ name: characterVersion.name, companyId: characterVersion.company })
			.where(eq(characterVersions.id, versionId));
		await Promise.all([
			this.deleteItems(versionId),
			this.deleteImplants(versionId),
			this.deleteExpertise(versionId)
		]);
		await Promise.all([
			this.saveExpertise({ versionId, expertise: characterVersion.expertise }),
			this.saveItems({ versionId, items: characterVersion.items }),
			this.saveImplants({ versionId, implants: characterVersion.implants })
		]);
		return versionId;
	}

	public async delete(characterVersionId: number): Promise<void> {
		await Promise.all([
			this.deleteItems(characterVersionId),
			this.deleteImplants(characterVersionId),
			this.deleteExpertise(characterVersionId),
			eventParticipantsRepo.deleteForCharacterVersion(characterVersionId)
		]);
		await db.delete(characterVersions).where(eq(characterVersions.id, characterVersionId));
	}

	public async getItemsforCharacterVersions(
		ids: number[]
	): Promise<{ characterVersionId: number; itemId: number; count: number }[]> {
		if (ids.length === 0) return [];
		const rows = await db
			.select({
				characterVersionId: characterVersionItems.characterVersionId,
				itemId: characterVersionItems.itemId,
				count: characterVersionItems.count
			})
			.from(characterVersionItems)
			.where(inArray(characterVersionItems.characterVersionId, ids));
		return rows
			.filter((row) => row.characterVersionId != null && row.itemId != null && row.count != null)
			.map((row) => ({
				characterVersionId: row.characterVersionId as number,
				itemId: row.itemId as number,
				count: row.count as number
			}));
	}

	public async getImplantsforCharacterVersions(ids: number[]): Promise<
		{
			characterVersionId: number;
			implantId: number;
			slot: number;
			chargesRemaining: number;
		}[]
	> {
		if (ids.length === 0) return [];
		const rows = await db
			.select({
				characterVersionId: characterVersionImplants.characterVersionId,
				implantId: characterVersionImplants.implantId,
				slot: characterVersionImplants.slot,
				chargesRemaining: characterVersionImplants.chargesRemaining
			})
			.from(characterVersionImplants)
			.where(inArray(characterVersionImplants.characterVersionId, ids));
		return rows
			.filter((row) => row.characterVersionId != null && row.implantId != null)
			.map((row) => ({
				characterVersionId: row.characterVersionId as number,
				implantId: row.implantId as number,
				slot: row.slot,
				chargesRemaining: row.chargesRemaining
			}));
	}

	public async getExpertiseForCharacterVersions(
		ids: number[]
	): Promise<{ characterVersionId: number; expertiseId: number; value: number }[]> {
		if (ids.length === 0) return [];
		const rows = await db
			.select({
				characterVersionId: characterVersionExpertise.characterVersionId,
				expertiseId: characterVersionExpertise.expertiseId,
				value: characterVersionExpertise.value
			})
			.from(characterVersionExpertise)
			.where(inArray(characterVersionExpertise.characterVersionId, ids));
		return rows
			.filter(
				(row) => row.characterVersionId != null && row.expertiseId != null && row.value != null
			)
			.map((row) => ({
				characterVersionId: row.characterVersionId as number,
				expertiseId: row.expertiseId as number,
				value: row.value as number
			}));
	}

	public async saveExpertise({
		versionId,
		expertise
	}: {
		versionId: number;
		expertise: CharacterVersionExpertise[];
	}) {
		await this.deleteExpertise(versionId);
		if (expertise.length === 0) return;
		await db.insert(characterVersionExpertise).values(
			expertise.map((entry) => ({
				characterVersionId: versionId,
				expertiseId: entry.id,
				value: entry.value
			}))
		);
	}

	public async saveItems({
		versionId,
		items
	}: {
		versionId: number;
		items: CharacterVersionItem[];
	}) {
		if (items.length === 0) return;
		await db
			.insert(characterVersionItems)
			.values(
				items.map((item) => ({ characterVersionId: versionId, itemId: item.id, count: item.count }))
			);
	}

	/**
	 * A fitted implant is written at full charge: `ChargesRemaining` is seeded from the catalog's
	 * `MaxCharges` rather than taken from the caller, because the loadout editor decides *which*
	 * implants a character carries and an admin refresh decides how charged they are — the write
	 * path never gets a say in the count. `update()` re-fits the whole loadout, so saving a version
	 * mid-event recharges it; that is a shop-side edit, not something a player can reach.
	 */
	public async saveImplants({
		versionId,
		implants: fitted
	}: {
		versionId: number;
		implants: CharacterVersionImplant[];
	}) {
		if (fitted.length === 0) return;
		const maxCharges = await this.maxChargesForImplants(fitted.map((implant) => implant.id));
		await db.insert(characterVersionImplants).values(
			fitted.map((implant) => ({
				characterVersionId: versionId,
				implantId: implant.id,
				slot: implant.slot,
				chargesRemaining: maxCharges.get(implant.id) ?? 0
			}))
		);
	}

	private async maxChargesForImplants(ids: number[]): Promise<Map<number, number>> {
		if (ids.length === 0) return new Map();
		const rows = await db
			.select({ id: implants.id, maxCharges: implants.maxCharges })
			.from(implants)
			.where(inArray(implants.id, ids));
		return new Map(rows.map((row) => [row.id, row.maxCharges]));
	}

	/**
	 * Spend one charge of an implant the given version carries — the device activation path.
	 *
	 * Addressed by catalog implant id rather than by instance row, because that is the id the
	 * device knows: `/api/my/implants` lists implants, not table rows. The version id is part of
	 * the same statement, so an activation can only ever reach an implant the caller's own
	 * character actually has fitted, and `ChargesRemaining > 0` is what keeps the count off the
	 * floor no matter how many activations race.
	 *
	 * Returns null when the version does not carry that implant at all — the caller's 404 — and
	 * otherwise says whether a charge was spent and what is left.
	 */
	public async spendCharge({
		characterVersionId,
		implantId
	}: {
		characterVersionId: number;
		implantId: number;
	}): Promise<{ spent: boolean; chargesRemaining: number } | null> {
		const fitted = and(
			eq(characterVersionImplants.characterVersionId, characterVersionId),
			eq(characterVersionImplants.implantId, implantId)
		);
		const before = await db
			.select({ chargesRemaining: characterVersionImplants.chargesRemaining })
			.from(characterVersionImplants)
			.where(fitted);
		if (before.length === 0) return null;

		// The same implant fitted in two slots is two rows and two stocks; one activation spends
		// one of them, lowest slot first, so a loadout drains in the order the player reads it.
		const [result] = await db
			.update(characterVersionImplants)
			.set({ chargesRemaining: sql`${characterVersionImplants.chargesRemaining} - 1` })
			.where(and(fitted, gt(characterVersionImplants.chargesRemaining, 0)))
			.orderBy(characterVersionImplants.slot)
			.limit(1);

		const after = await db
			.select({ chargesRemaining: characterVersionImplants.chargesRemaining })
			.from(characterVersionImplants)
			.where(fitted);
		return {
			spent: result.affectedRows > 0,
			chargesRemaining: after.reduce((total, row) => total + row.chargesRemaining, 0)
		};
	}

	/**
	 * Put every implant this version carries back to its catalog `MaxCharges` — the admin refresh.
	 *
	 * A correlated subquery rather than a read-then-write, so a live event's recharge is one
	 * statement and cannot half-apply. Uncharged implants land back on 0, which is where they
	 * already were.
	 */
	public async refreshCharges(characterVersionId: number): Promise<number> {
		const [result] = await db
			.update(characterVersionImplants)
			.set({
				chargesRemaining: sql`(select ${implants.maxCharges} from ${implants} where ${implants.id} = ${characterVersionImplants.implantId})`
			})
			.where(eq(characterVersionImplants.characterVersionId, characterVersionId));
		return result.affectedRows;
	}

	private async deleteExpertise(versionId: number): Promise<void> {
		await db
			.delete(characterVersionExpertise)
			.where(eq(characterVersionExpertise.characterVersionId, versionId));
	}

	public async getWithdIds(ids: number[]): Promise<CharacterVersionBare[]> {
		if (ids.length === 0) return [];
		const rows = await db
			.select(versionColumns)
			.from(characterVersions)
			.where(inArray(characterVersions.id, ids));
		return collect(await this.attachChildren(rows), toBareDeduped);
	}

	public async getWithId(id: number): Promise<CharacterVersionBare | undefined> {
		return (await this.getWithdIds([id]))[0];
	}

	public async getAllWithCharacterName(): Promise<
		{ id: number; name: string; characterId: number; characterName: string; ownerName: string }[]
	> {
		const rows = await db
			.select({
				id: characterVersions.id,
				name: characterVersions.name,
				characterId: characterVersions.characterId,
				characterName: characters.name,
				ownerName: users.name
			})
			.from(characterVersions)
			.innerJoin(characters, eq(characters.id, characterVersions.characterId))
			.innerJoin(users, eq(users.id, characters.owner));

		return rows
			.filter((row) => row.name != null && row.characterName != null && row.ownerName != null)
			.map((row) => ({
				id: row.id,
				name: row.name as string,
				characterId: row.characterId,
				characterName: row.characterName as string,
				ownerName: row.ownerName as string
			}));
	}

	public async getForCharacter(characterId: number): Promise<CharacterVersionBare[]> {
		const rows = await db
			.select(versionColumns)
			.from(characterVersions)
			.where(eq(characterVersions.characterId, characterId));
		return collect(await this.attachChildren(rows), toBare);
	}

	public async deleteItems(characterVersionId: number): Promise<void> {
		await db
			.delete(characterVersionItems)
			.where(eq(characterVersionItems.characterVersionId, characterVersionId));
	}

	public async deleteImplants(characterVersionId: number): Promise<void> {
		await db
			.delete(characterVersionImplants)
			.where(eq(characterVersionImplants.characterVersionId, characterVersionId));
	}

	public async getForUser(userId: number): Promise<CharacterVersionBare[]> {
		const rows = await db
			.select(versionColumns)
			.from(characterVersions)
			.innerJoin(characters, eq(characters.id, characterVersions.characterId))
			.where(eq(characters.owner, userId));
		return collect(await this.attachChildren(rows), toBare);
	}
}
export const characterVersionRepo = new CharacterVersionRepo();

export type CharacterVersionExpertise = {
	id: number;
	value: number;
};

export function isCharacterVersionExpertise(
	expertise: unknown
): expertise is CharacterVersionExpertise {
	return (
		typeof expertise === 'object' &&
		expertise != null &&
		'id' in expertise &&
		typeof expertise.id === 'number' &&
		'value' in expertise &&
		typeof expertise.value === 'number'
	);
}

export type CharacterVersionItem = {
	id: number;
	count: number;
};

export function isCharacterVersionItem(item: unknown): item is CharacterVersionItem {
	return (
		typeof item === 'object' &&
		item != null &&
		'id' in item &&
		typeof item.id === 'number' &&
		'count' in item &&
		typeof item.count === 'number'
	);
}

export type CharacterVersionImplant = {
	id: number;
	slot: number;
	/**
	 * Read-only: filled in on the way out, ignored on the way in. The loadout editor posts back
	 * what a character carries, and letting it post a charge count would hand a player the admin's
	 * refresh — `saveImplants` seeds the count from the catalog instead.
	 */
	chargesRemaining?: number;
};

export function isCharacterVersionImplant(value: unknown): value is CharacterVersionImplant {
	return (
		typeof value === 'object' &&
		value != null &&
		'id' in value &&
		typeof value.id === 'number' &&
		'slot' in value &&
		typeof value.slot === 'number'
	);
}

export type CharacterVersionBare = {
	id: number | null;
	characterId: number;
	name: string;
	expertise: CharacterVersionExpertise[];
	items: CharacterVersionItem[];
	implants: CharacterVersionImplant[];
	company: number;
};

export function isCharacterVersionBare(value: unknown): value is CharacterVersionBare {
	return (
		typeof value === 'object' &&
		value != null &&
		'id' in value &&
		(typeof value.id === 'number' || value.id == null) &&
		'name' in value &&
		typeof value.name === 'string' &&
		'characterId' in value &&
		typeof value.characterId === 'number' &&
		'expertise' in value &&
		Array.isArray(value.expertise) &&
		value.expertise.every(isCharacterVersionExpertise) &&
		'items' in value &&
		Array.isArray(value.items) &&
		value.items.every(isCharacterVersionItem) &&
		'implants' in value &&
		Array.isArray(value.implants) &&
		value.implants.every(isCharacterVersionImplant) &&
		'company' in value &&
		typeof value.company === 'number'
	);
}
