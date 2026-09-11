import { and, eq, exists, inArray, or, sql } from 'drizzle-orm';
import { db } from './mysql';
import { expertise as expertiseTable, expertiseCharacterAccess, expertiseGroups } from './schema';
import { sanitizeSvg } from '$lib/utils/svg-sanitize';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** Sanitize an admin-supplied icon for storage, treating empty strings as null. */
function normalizeIcon(icon: string | null | undefined): string | null {
	if (icon == null) return null;
	const cleaned = sanitizeSvg(icon).trim();
	return cleaned.length > 0 ? cleaned : null;
}

/** Accept only `#rrggbb` colours, otherwise store null. */
function normalizeColor(color: string | null | undefined): string | null {
	if (color == null) return null;
	return HEX_COLOR.test(color) ? color : null;
}

const expertiseColumns = {
	id: expertiseTable.id,
	name: expertiseTable.name,
	description: expertiseTable.description,
	characterAccess: expertiseTable.characterAccess,
	icon: expertiseTable.icon,
	groupId: expertiseGroups.id,
	groupName: expertiseGroups.name,
	groupIcon: expertiseGroups.icon,
	groupColor: expertiseGroups.color
};

type ExpertiseRow = {
	id: number;
	name: string | null;
	description: string | null;
	characterAccess: 'all' | 'none' | 'specific';
	icon: string | null;
	groupId: number;
	groupName: string;
	groupIcon: string | null;
	groupColor: string | null;
};

/** `Name` and `Description` are nullable in the schema but required by the domain type. */
function toExpertise(row: ExpertiseRow): Expertise {
	return {
		id: row.id,
		name: row.name ?? '',
		description: row.description ?? '',
		characterAccess: row.characterAccess,
		icon: row.icon,
		groupId: row.groupId,
		groupName: row.groupName,
		groupIcon: row.groupIcon,
		groupColor: row.groupColor,
		allowedCharacterIds: []
	};
}

const groupColumns = {
	id: expertiseGroups.id,
	name: expertiseGroups.name,
	description: expertiseGroups.description,
	icon: expertiseGroups.icon,
	color: expertiseGroups.color
};

class ExpertiseRepo {
	private selectExpertise() {
		return db
			.select(expertiseColumns)
			.from(expertiseTable)
			.innerJoin(expertiseGroups, eq(expertiseTable.groupId, expertiseGroups.id));
	}

	public async getAll(): Promise<Expertise[]> {
		return (await this.selectExpertise()).map(toExpertise);
	}

	public async getAllForCharacter(characterId: number): Promise<Expertise[]> {
		const rows = await this.selectExpertise().where(
			or(
				eq(expertiseTable.characterAccess, 'all'),
				and(
					eq(expertiseTable.characterAccess, 'specific'),
					exists(
						db
							.select({ one: sql`1` })
							.from(expertiseCharacterAccess)
							.where(
								and(
									eq(expertiseCharacterAccess.expertiseId, expertiseTable.id),
									eq(expertiseCharacterAccess.characterId, characterId)
								)
							)
					)
				)
			)
		);
		return rows.map(toExpertise);
	}

	public async getAllAccessibleToAll(): Promise<Expertise[]> {
		const rows = await this.selectExpertise().where(eq(expertiseTable.characterAccess, 'all'));
		return rows.map(toExpertise);
	}

	public async getWithId(id: number) {
		const [rows, accessRows] = await Promise.all([
			this.selectExpertise().where(eq(expertiseTable.id, id)),
			db
				.select({ characterId: expertiseCharacterAccess.characterId })
				.from(expertiseCharacterAccess)
				.where(eq(expertiseCharacterAccess.expertiseId, id))
		]);
		const [row] = rows;
		if (row == null) return null;
		return { ...toExpertise(row), allowedCharacterIds: accessRows.map((r) => r.characterId) };
	}

	public async getWithIds(ids: number[]): Promise<Expertise[]> {
		if (ids.length === 0) return [];
		const rows = await this.selectExpertise().where(inArray(expertiseTable.id, ids));
		return rows.map(toExpertise);
	}

	public async setCharacterAccess(
		id: number,
		access: Expertise['characterAccess'],
		characterIds: number[]
	) {
		await db.transaction(async (tx) => {
			await tx
				.update(expertiseTable)
				.set({ characterAccess: access ?? 'all' })
				.where(eq(expertiseTable.id, id));
			await tx.delete(expertiseCharacterAccess).where(eq(expertiseCharacterAccess.expertiseId, id));
			if (access === 'specific' && characterIds.length > 0) {
				await tx
					.insert(expertiseCharacterAccess)
					.values(characterIds.map((characterId) => ({ expertiseId: id, characterId })));
			}
		});
	}

	public save(item: Expertise) {
		if (item.id == null) return this.create(item);
		return this.edit(item);
	}

	public async create({
		name,
		description,
		groupId,
		icon
	}: Pick<Expertise, 'name' | 'description' | 'groupId' | 'icon'>) {
		const [result] = await db
			.insert(expertiseTable)
			.values({ name, description, groupId, icon: normalizeIcon(icon) });
		return result.insertId ?? null;
	}

	public async edit({
		id,
		name,
		description,
		groupId,
		icon
	}: Pick<Expertise, 'id' | 'name' | 'description' | 'groupId' | 'icon'>) {
		await db
			.update(expertiseTable)
			.set({ name, description, groupId, icon: normalizeIcon(icon) })
			.where(eq(expertiseTable.id, id as number));
		return id;
	}

	public async delete({ id }: { id: number }) {
		await db.delete(expertiseCharacterAccess).where(eq(expertiseCharacterAccess.expertiseId, id));
		await db.delete(expertiseTable).where(eq(expertiseTable.id, id));
	}

	public async getAllGroups(): Promise<ExpertiseGroup[]> {
		return db.select(groupColumns).from(expertiseGroups);
	}

	public async getGroupWithId(id: number): Promise<ExpertiseGroup | null> {
		const [group] = await db
			.select(groupColumns)
			.from(expertiseGroups)
			.where(eq(expertiseGroups.id, id));
		return group ?? null;
	}

	public saveExpertiseGroup(expertiseGroup: ExpertiseGroup) {
		if (expertiseGroup.id == null) return this.createExpertiseGroup(expertiseGroup);
		return this.editExpertiseGroup(expertiseGroup);
	}

	private async createExpertiseGroup({
		name,
		description,
		icon,
		color
	}: Pick<ExpertiseGroup, 'name' | 'description' | 'icon' | 'color'>) {
		const [result] = await db.insert(expertiseGroups).values({
			name,
			description,
			icon: normalizeIcon(icon),
			color: normalizeColor(color)
		});
		return result.insertId ?? null;
	}

	private async editExpertiseGroup({
		id,
		name,
		description,
		icon,
		color
	}: Pick<ExpertiseGroup, 'id' | 'name' | 'description' | 'icon' | 'color'>) {
		await db
			.update(expertiseGroups)
			.set({ name, description, icon: normalizeIcon(icon), color: normalizeColor(color) })
			.where(eq(expertiseGroups.id, id as number));
		return id;
	}

	public async deleteExpertiseGroup(groupId: number) {
		await this.deleteAllExpertiseWithGroup(groupId);
		await this.deleteExpertiseGroupWithId(groupId);
	}

	private async deleteAllExpertiseWithGroup(groupId: number) {
		const ids = (
			await db
				.select({ id: expertiseTable.id })
				.from(expertiseTable)
				.where(eq(expertiseTable.groupId, groupId))
		).map((row) => row.id);
		if (ids.length > 0) {
			await db
				.delete(expertiseCharacterAccess)
				.where(inArray(expertiseCharacterAccess.expertiseId, ids));
		}
		await db.delete(expertiseTable).where(eq(expertiseTable.groupId, groupId));
		return groupId;
	}

	private async deleteExpertiseGroupWithId(groupId: number) {
		await db.delete(expertiseGroups).where(eq(expertiseGroups.id, groupId));
		return groupId;
	}
}
export const expertiseRepo = new ExpertiseRepo();

export type Expertise = {
	id: number | null;
	name: string;
	description: string;
	groupId: number;
	groupName: string;
	characterAccess?: 'all' | 'none' | 'specific';
	allowedCharacterIds?: number[];
	/** SVG markup for this expertise's icon (nullable, admin-supplied). */
	icon?: string | null;
	/** SVG markup for the parent group's icon (read-only, joined from the group). */
	groupIcon?: string | null;
	/** Hex colour of the parent group (read-only, joined from the group). */
	groupColor?: string | null;
};

export function isExpertise(expertise: unknown): expertise is Expertise {
	return (
		typeof expertise === 'object' &&
		expertise !== null &&
		'name' in expertise &&
		typeof expertise.name === 'string' &&
		'description' in expertise &&
		typeof expertise.description === 'string' &&
		'groupId' in expertise &&
		typeof expertise.groupId === 'number' &&
		'groupName' in expertise &&
		typeof expertise.groupName === 'string' &&
		'id' in expertise &&
		(typeof expertise.id === 'number' || expertise.id === null) &&
		('icon' in expertise === false || typeof expertise.icon === 'string' || expertise.icon == null)
	);
}

export type ExpertiseGroup = {
	id: number | null;
	name: string;
	description: string;
	/** SVG markup for this group's icon (nullable, admin-supplied). */
	icon?: string | null;
	/** Hex colour (`#rrggbb`) for this group (nullable, admin-supplied). */
	color?: string | null;
};

export function isExpertiseGroup(group: unknown): group is ExpertiseGroup {
	return (
		typeof group === 'object' &&
		group !== null &&
		'name' in group &&
		typeof group.name === 'string' &&
		'description' in group &&
		typeof group.description === 'string' &&
		'id' in group &&
		(typeof group.id === 'number' || group.id === null) &&
		('icon' in group === false || typeof group.icon === 'string' || group.icon == null) &&
		('color' in group === false || typeof group.color === 'string' || group.color == null)
	);
}
