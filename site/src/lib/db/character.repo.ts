import { mysqlconnFn } from './mysql';

class CharacterRepo {
	private characterSelector = `
	SELECT
		c.Id as id,
		c.Name as name,
		c.Owner as ownerId,
		u.Name as ownerName,
		c.BackstoryUrl as backstoryUrl
	FROM Characters c
	JOIN Users u
		on u.id = c.Owner
	`;

	public async getById(id: number): Promise<Character> {
		const [result] = await (
			mysqlconnFn()
		).execute(`${this.characterSelector} WHERE c.id = ?`, [id]);
		const [firstCharacter] = result as any;
		if (isCharacter(firstCharacter)) {
			return {
				id: firstCharacter.id,
				name: firstCharacter.name,
				ownerId: firstCharacter.ownerId,
				ownerName: firstCharacter.ownerName,
				backstoryUrl: firstCharacter.backstoryUrl ?? null,
			};
		} else {
			throw new Error(`character not found with id: ${id}`);
		}
	}

	public async getByOwner(ownerId: number): Promise<Character[]> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`SELECT c.Id as id, c.Name as name, c.Owner as ownerId, u.Name as ownerName
			 FROM Characters c
			 JOIN Users u ON u.Id = c.Owner
			 WHERE c.Owner = ?`,
			[ownerId]
		);
		if (!Array.isArray(result)) return [];
		return (result as any[]).filter(isCharacter);
	}

	public async getForUser(userId: number) {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(`${this.characterSelector} WHERE u.id = ?`, [userId]);
		if(isCharacter(result) === false) return null;
		return result;
	}

	public async getAll(): Promise<Character[]> {
		const [result] = await (mysqlconnFn()).execute(this.characterSelector);
		const characters = result as any[];
		return characters
			.map((character) => {
				if (isCharacter(character)) {
					return {
						id: character.id,
						name: character.name,
						ownerId: character.ownerId,
						ownerName: character.ownerName,
						backstoryUrl: character.backstoryUrl ?? null,
					};
				} else {
					console.error(`can't convert to character: `, { character });
					return undefined;
				}
			})
			.filter((value) => value != null);
	}

	public async save(character: NewCharacter | Character): Promise<number | undefined> {
		if (isCharacter(character)) { await this.edit(character); return character.id; }
		if (isNewCharacter(character)) return this.create(character);
	}

	private async create(character: NewCharacter): Promise<number> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`INSERT INTO Characters (Name, Owner, BackstoryUrl) VALUES (?, ?, ?)`,
			[character.name, character.ownerId, character.backstoryUrl ?? null]
		);
		return (result as any).insertId as number;
	}

	private async edit(character: Character) {
		try {
			(mysqlconnFn()).execute(
				`
				UPDATE Characters
				SET Name = ?,
					Owner = ?,
					BackstoryUrl = COALESCE(?, BackstoryUrl)
				WHERE id = ?
			`,
				[character.name, character.ownerId, character.backstoryUrl ?? null, character.id]
			);
		} catch (error) {
			throw error;
		}
	}

	public async saveBackstoryUrl(id: number, url: string) {
		(await mysqlconnFn()).execute(
			'UPDATE Characters SET BackstoryUrl = ? WHERE Id = ?',
			[url, id]
		);
	}
}

export const characterRepo = new CharacterRepo();

export type Character = NewCharacter & {
	id: number;
	ownerName: string;
	backstoryUrl?: string | null;
};

export function isCharacter(character: any): character is Character {
	return (
		typeof character?.id === 'number' &&
		typeof character?.ownerName === 'string' &&
		isNewCharacter(character)
	);
}

export type NewCharacter = {
	name: string;
	ownerId: number;
	backstoryUrl?: string | null;
};

export function isNewCharacter(character: any): character is NewCharacter {
	return (
		typeof character?.name === 'string' &&
		typeof character?.ownerId === 'number' 
	);
}
