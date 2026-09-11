import { eq, inArray, sql } from 'drizzle-orm';
import { db } from './mysql';
import {
	characterVersionExpertise,
	characterVersionImplants,
	characterVersionItems,
	characterVersions,
	characters,
	eventParticipants,
	subcoMembers,
	users
} from './schema';

const characterColumns = {
	id: characters.id,
	name: characters.name,
	ownerId: characters.owner,
	ownerName: users.name,
	backstoryId: characters.backstoryId,
	implantLimit: characters.implantLimit
};

type CharacterRow = {
	id: number;
	name: string | null;
	ownerId: number | null;
	ownerName: string | null;
	backstoryId: string | null;
	implantLimit: number;
};

function toCharacter(row: CharacterRow): Character {
	return {
		id: row.id,
		name: row.name ?? '',
		// `Owner` is nullable, but the join to Users means only owned rows come back.
		ownerId: row.ownerId as number,
		ownerName: row.ownerName ?? '',
		backstoryId: row.backstoryId,
		implantLimit: row.implantLimit
	};
}

class CharacterRepo {
	private selectCharacters() {
		return db
			.select(characterColumns)
			.from(characters)
			.innerJoin(users, eq(users.id, characters.owner));
	}

	public async getById(id: number): Promise<Character> {
		const [row] = await this.selectCharacters().where(eq(characters.id, id));
		if (row == null) throw new Error(`character not found with id: ${id}`);
		return toCharacter(row);
	}

	public async getByName(name: string): Promise<Character[]> {
		const rows = await this.selectCharacters().where(
			sql`LOWER(TRIM(${characters.name})) = LOWER(TRIM(${name}))`
		);
		return rows.map(toCharacter);
	}

	public async getByOwner(ownerId: number): Promise<Character[]> {
		const rows = await this.selectCharacters().where(eq(characters.owner, ownerId));
		return rows.map(toCharacter);
	}

	public async getForUser(userId: number): Promise<Character[]> {
		const rows = await this.selectCharacters().where(eq(users.id, userId));
		return rows.map(toCharacter);
	}

	public async getAll(): Promise<Character[]> {
		const rows = await this.selectCharacters();
		return rows.map(toCharacter);
	}

	public async save(character: NewCharacter | Character): Promise<number | undefined> {
		if (isCharacter(character)) {
			await this.edit(character);
			return character.id;
		}
		if (isNewCharacter(character)) return this.create(character);
	}

	private async create(character: NewCharacter): Promise<number> {
		const [result] = await db.insert(characters).values({
			name: character.name,
			owner: character.ownerId,
			backstoryId: character.backstoryId ?? null,
			implantLimit: character.implantLimit ?? 2
		});
		return result.insertId;
	}

	private async edit(character: Character) {
		await db
			.update(characters)
			.set({
				name: character.name,
				owner: character.ownerId,
				// Keep the stored id when the caller does not supply one.
				backstoryId: sql`COALESCE(${character.backstoryId ?? null}, ${characters.backstoryId})`,
				implantLimit: character.implantLimit ?? 2
			})
			.where(eq(characters.id, character.id));
	}

	public async saveBackstoryId(id: number, backstoryId: string) {
		await db.update(characters).set({ backstoryId }).where(eq(characters.id, id));
	}

	public async delete(id: number): Promise<void> {
		const versionIds = (
			await db
				.select({ id: characterVersions.id })
				.from(characterVersions)
				.where(eq(characterVersions.characterId, id))
		).map((row) => row.id);

		if (versionIds.length > 0) {
			await db
				.delete(characterVersionExpertise)
				.where(inArray(characterVersionExpertise.characterVersionId, versionIds));
			await db
				.delete(characterVersionItems)
				.where(inArray(characterVersionItems.characterVersionId, versionIds));
			await db
				.delete(characterVersionImplants)
				.where(inArray(characterVersionImplants.characterVersionId, versionIds));
			await db
				.delete(eventParticipants)
				.where(inArray(eventParticipants.characterVersionId, versionIds));
		}

		await db.delete(characterVersions).where(eq(characterVersions.characterId, id));
		await db.delete(subcoMembers).where(eq(subcoMembers.memberId, id));
		await db.delete(characters).where(eq(characters.id, id));
	}
}

export const characterRepo = new CharacterRepo();

export type Character = NewCharacter & {
	id: number;
	ownerName: string;
	backstoryId?: string | null;
	implantLimit?: number;
};

export function isCharacter(character: unknown): character is Character {
	if (typeof character !== 'object' || character === null) return false;
	const c = character as Record<string, unknown>;
	return typeof c.id === 'number' && typeof c.ownerName === 'string' && isNewCharacter(character);
}

export type NewCharacter = {
	name: string;
	ownerId: number;
	backstoryId?: string | null;
	implantLimit?: number;
};

export function isNewCharacter(character: unknown): character is NewCharacter {
	if (typeof character !== 'object' || character === null) return false;
	const c = character as Record<string, unknown>;
	return typeof c.name === 'string' && typeof c.ownerId === 'number';
}
