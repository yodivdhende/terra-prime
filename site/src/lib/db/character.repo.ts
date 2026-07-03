import { mysqlconnFn } from './mysql';

class CharacterRepo {
  private characterSelector = `
	SELECT
		c.Id as id,
		c.Name as name,
		c.Owner as ownerId,
		u.Name as ownerName,
		c.BackstoryId as backstoryId,
		c.ImplantLimit as implantLimit
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
        backstoryId: firstCharacter.backstoryId ?? null,
        implantLimit: firstCharacter.implantLimit ?? 2,
      };
    } else {
      throw new Error(`character not found with id: ${id}`);
    }
  }

  public async getByOwner(ownerId: number): Promise<Character[]> {
    const connection = mysqlconnFn();
    const [result] = await connection.execute(
      `SELECT c.Id as id, c.Name as name, c.Owner as ownerId, u.Name as ownerName, c.ImplantLimit as implantLimit
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
    const [queryResults] = await connection.execute(`${this.characterSelector} WHERE u.id = ?`, [userId]);
    const results = (queryResults as []).map(queryResult => {
      if (isCharacter(queryResult) === false) return null;
      return queryResult;
    }).filter(value => value != null);
    return results;
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
            backstoryId: character.backstoryId ?? null,
            implantLimit: character.implantLimit ?? 2,
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
      `INSERT INTO Characters (Name, Owner, BackstoryId, ImplantLimit) VALUES (?, ?, ?, ?)`,
      [character.name, character.ownerId, character.backstoryId ?? null, character.implantLimit ?? 2]
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
					BackstoryId = COALESCE(?, BackstoryId),
					ImplantLimit = ?
				WHERE id = ?
			`,
        [character.name, character.ownerId, character.backstoryId ?? null, character.implantLimit ?? 2, character.id]
      );
    } catch (error) {
      throw error;
    }
  }

  public async saveBackstoryId(id: number, backstoryId: string) {
    (await mysqlconnFn()).execute(
      'UPDATE Characters SET BackstoryId = ? WHERE Id = ?',
      [backstoryId, id]
    );
  }

  public async delete(id: number): Promise<void> {
    const connection = mysqlconnFn();

    const [versionRows] = await connection.execute(
      `SELECT Id FROM Character_Versions WHERE \`Character\` = ?`,
      [id]
    );
    const versionIds = (versionRows as any[]).map((r) => r.Id);

    if (versionIds.length > 0) {
      const placeholders = versionIds.map(() => '?').join(', ');
      await connection.execute(`DELETE FROM Character_Version_Skills WHERE CharacterVersion IN (${placeholders})`, versionIds);
      await connection.execute(`DELETE FROM Character_Version_Items WHERE CharacterVersion IN (${placeholders})`, versionIds);
      await connection.execute(`DELETE FROM Character_Version_Implants WHERE CharacterVersion IN (${placeholders})`, versionIds);
      await connection.execute(`DELETE FROM Event_Participants WHERE CharacterVersion IN (${placeholders})`, versionIds);
    }

    await connection.execute(`DELETE FROM Character_Versions WHERE \`Character\` = ?`, [id]);
    await connection.execute(`DELETE FROM Party_Members WHERE Member = ?`, [id]);
    await connection.execute(`DELETE FROM Characters WHERE Id = ?`, [id]);
  }
}

export const characterRepo = new CharacterRepo();

export type Character = NewCharacter & {
  id: number;
  ownerName: string;
  backstoryId?: string | null;
  implantLimit?: number;
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
  backstoryId?: string | null;
  implantLimit?: number;
};

export function isNewCharacter(character: any): character is NewCharacter {
  return (
    typeof character?.name === 'string' &&
    typeof character?.ownerId === 'number'
  );
}
