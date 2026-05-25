import { valueOrLogOfPromiseSetteld } from '$lib/utils/request';
import { mysqlconnFn } from './mysql';

class CharacterVersionRepo {
  public async getAll(): Promise<CharacterVersionBare[]> {
    const connection = await mysqlconnFn();
    const [results] = await connection.execute(`
      SELECT
        cv.Id as id,
        cv.Character as characterId,
        cv.Name as name,
        cv.Company as company
      FROM Character_Versions cv
      `);
    if (Array.isArray(results) === false) return [];
    if (results.length === 0) return [];
    const ids = (results as any[]).map(({ id }) => id).filter((id): id is number => typeof id === 'number');
    const [items, implants, skills] = await Promise.allSettled([
      this.getItemsforCharacterVersions(ids),
      this.getImplantsforCharacterVersions(ids),
      this.getSkillsForCharacterVerions(ids)
    ]);
    const characterVersions: CharacterVersionBare[] = [];
    for (const characterItem of results as any[]) {
      if ('id' in characterItem === false || typeof characterItem.id != 'number') continue;
      if ('characterId' in characterItem === false || typeof characterItem.characterId != 'number')
        continue;
      if ('name' in characterItem === false || typeof characterItem.name != 'string') continue;
      characterVersions.push({
        id: characterItem.id,
        characterId: characterItem.charaacterId,
        name: characterItem.name,
        company: typeof characterItem.company === 'number' ? characterItem.company : null,
        skills:
          skills.status === 'fulfilled'
            ? skills.value
              .filter(({ characterVersionId }) => characterVersionId, characterItem.characterId)
              .map(({ skillId, value }) => ({ id: skillId, value }))
            : [],
        items:
          items.status === 'fulfilled'
            ? items.value
              .filter(({ characterVersionId }) => characterVersionId, characterItem.characterId)
              .map(({ itemId, count }) => ({ id: itemId, count }))
            : [],
        implants:
          implants.status === 'fulfilled'
            ? implants.value
              .filter(({ characterVersionId }) => characterVersionId, characterItem.characterId)
              .map(({ implantId }) => implantId)
            : []
      });
    }
    return characterVersions;
  }

  public save(characterVersion: CharacterVersionBare): Promise<number> {
    if (characterVersion.id != null) return this.update(characterVersion);
    return this.create(characterVersion);
  }

  public async create(characterVersion: CharacterVersionBare): Promise<number> {
    const connection = await mysqlconnFn();
    const [result] = await connection.execute(
      `INSERT INTO Character_Versions (\`Character\`, Name, Company) VALUES (?, ?, ?)`,
      [characterVersion.characterId, characterVersion.name, characterVersion.company ?? null]
    );
    const versionId = (result as any).insertId as number;
    await Promise.all([
      characterVersion.skills.length > 0 ? this.saveSkills({ versionId, skills: characterVersion.skills }) : Promise.resolve(),
      characterVersion.items.length > 0 ? this.saveItems({ versionId, items: characterVersion.items }) : Promise.resolve(),
      characterVersion.implants.length > 0 ? this.saveImplants({ versionId, implants: characterVersion.implants }) : Promise.resolve(),
    ]);
    return versionId;
  }

  public async update(characterVersion: CharacterVersionBare): Promise<number> {
    if (characterVersion.id == null) throw new Error('update requires an id');
    const versionId = characterVersion.id;
    const connection = await mysqlconnFn();
    await connection.execute(
      `UPDATE Character_Versions SET Name = ?, Company = ? WHERE Id = ?`,
      [characterVersion.name, characterVersion.company ?? null, versionId]
    );
    await Promise.all([
      this.deleteItems(versionId),
      this.deleteImplants(versionId),
      this.deleteSkills(versionId)
    ]);
    await Promise.all([
      characterVersion.skills.length > 0 ? this.saveSkills({ versionId, skills: characterVersion.skills }) : Promise.resolve(),
      characterVersion.items.length > 0 ? this.saveItems({ versionId, items: characterVersion.items }) : Promise.resolve(),
      characterVersion.implants.length > 0 ? this.saveImplants({ versionId, implants: characterVersion.implants }) : Promise.resolve(),
    ]);
    return versionId;
  }

  public async delete(characterVersionId: number): Promise<void> {
    await Promise.all([
      await this.deleteItems(characterVersionId),
      await this.deleteImplants(characterVersionId),
      await this.deleteSkills(characterVersionId)
    ]);
    await this.deleteCharacterVerion(characterVersionId);
  }

  public async getItemsforCharacterVersions(
    ids: number[]
  ): Promise<{ characterVersionId: number; itemId: number, count: number }[]> {
    const connection = await mysqlconnFn();
    const [result] = await connection.query(
      `
      SELECT 
        cvit.CharacterVersion as characterVersionId,
        cvit.Item as itemId,
				cvit.Count as count
      FROM Character_Version_Items cvit
      WHERE cvit.CharacterVersion in (:ids)
      `,
      { ids }
    );
    if (Array.isArray(result) === false) return [];
    if (result.length === 0) return [];
    const items: { characterVersionId: number; itemId: number, count: number }[] = [];
    for (const item of result) {
      if ('characterVersionId' in item === false || typeof item.characterVersionId !== 'number')
        continue;
      if ('itemId' in item === false || typeof item.itemId != 'number') continue;
      if ('count' in item === false || typeof item.count != 'number') continue;
      items.push({ characterVersionId: item.characterVersionId, itemId: item.itemId, count: item.count });
    }
    return items;
  }

  public async getImplantsforCharacterVersions(
    ids: number[]
  ): Promise<{ characterVersionId: number; implantId: number }[]> {
    const connection = await mysqlconnFn();
    const [result] = await connection.query(
      `
      SELECT 
        cvim.CharacterVersion as characterVersionId,
        cvim.Implant as implantId
      FROM Character_Version_Implants cvim
      WHERE cvim.CharacterVersion in (:ids)
      `,
      { ids }
    );
    if (Array.isArray(result) === false) return [];
    if (result.length === 0) return [];
    const implants: { characterVersionId: number; implantId: number }[] = [];
    for (const item of result) {
      if ('characterVersionId' in item === false || typeof item.characterVersionId !== 'number')
        continue;
      if ('implantId' in item === false || typeof item.implantId != 'number') continue;
      implants.push({ characterVersionId: item.characterVersionId, implantId: item.implantId });
    }
    return implants;
  }

  public async getSkillsForCharacterVerions(
    ids: number[]
  ): Promise<{ characterVersionId: number; skillId: number; value: number }[]> {
    const connection = await mysqlconnFn();
    const [result] = await connection.query(
      `
      SELECT
        cvs.CharacterVersion as characterVersionId,
        cvs.Skill as skillId,
        cvs.Value as value
      FROM Character_Version_Skills cvs
      WHERE cvs.CharacterVersion in (:ids)
      `,
      { ids }
    );
    if (Array.isArray(result) === false) return [];
    if (result.length === 0) return [];
    const skills: { characterVersionId: number; skillId: number; value: number }[] = [];
    for (const item of result) {
      if ('characterVersionId' in item === false || typeof item.characterVersionId !== 'number')
        continue;
      if ('skillId' in item === false || typeof item.skillId != 'number') continue;
      if ('value' in item === false || typeof item.value != 'number') continue;
      skills.push({
        characterVersionId: item.characterVersionId,
        skillId: item.skillId,
        value: item.value
      });
    }
    return skills;
  }

  public async saveSkills({
    versionId,
    skills
  }: {
    versionId: number;
    skills: CharacterVerionSkill[];
  }) {
    this.deleteSkills(versionId);
    const connection = await mysqlconnFn();
    const [result] = await connection.query(
      `
				INSERT INTO Character_Version_Skills (CharacterVersion, Skill, Value)
				VALUES ?
			`,
      [skills.map((skill) => [versionId, skill.id, skill.value])]
    );
  }

  public async saveItems({ versionId, items }: { versionId: number; items: CharacterVersionItem[] }) {
    const connection = await mysqlconnFn();
    await connection.query(
      `INSERT INTO Character_Version_Items (CharacterVersion, Item, Count) VALUES ?`,
      [items.map((item) => [versionId, item.id, item.count])]
    );
  }

  public async saveImplants({ versionId, implants }: { versionId: number; implants: number[] }) {
    const connection = await mysqlconnFn();
    await connection.query(
      `INSERT INTO Character_Version_Implants (CharacterVersion, Implant) VALUES ?`,
      [implants.map((id) => [versionId, id])]
    );
  }

  private async deleteSkills(versionId: number): Promise<void> {
    const connection = await mysqlconnFn();
    await connection.query(
      `DELETE FROM Character_Version_Skills cvs WHERE cvs.CharacterVersion = ?`,
      [versionId]
    );
  }

  public async getWithdIds(ids: number[]): Promise<CharacterVersionBare[]> {
    const connection = await mysqlconnFn();
    const [results] = await connection.query(
      `
      SELECT
        cv.Id as id,
        cv.Character as characterId,
        cv.Name as name,
        cv.Company as company
      FROM Character_Versions cv
      WHERE cv.id in (:ids)
      `,
      { ids }
    );
    if (Array.isArray(results) === false) return [];
    if (results.length === 0) return [];
    const existingIds = (results as any[]).map(({ id }) => id).filter((id): id is number => typeof id === 'number');
    const [items, implants, skills] = await Promise.allSettled([
      this.getItemsforCharacterVersions(existingIds),
      this.getImplantsforCharacterVersions(existingIds),
      this.getSkillsForCharacterVerions(existingIds)
    ]);
    const characterVersions: CharacterVersionBare[] = [];
    for (const characterItem of results as any[]) {
      if ('id' in characterItem === false || typeof characterItem.id != 'number') continue;
      if ('characterId' in characterItem === false || typeof characterItem.characterId != 'number')
        continue;
      if ('name' in characterItem === false || typeof characterItem.name != 'string') continue;
      characterVersions.push({
        id: characterItem.id,
        characterId: characterItem.characterId,
        name: characterItem.name,
        company: typeof characterItem.company === 'number' ? characterItem.company : null,
        skills:
          valueOrLogOfPromiseSetteld(skills)
            ?.filter(({ characterVersionId }) => characterVersionId === characterItem.id)
            .map(({ skillId, value }) => ({ id: skillId, value })) ?? [],
        items:
          valueOrLogOfPromiseSetteld(items)
            ?.filter(({ characterVersionId }) => characterVersionId === characterItem.id)
            .map(({ itemId, count }) => ({ id: itemId, count })) ?? [],
        implants:
          valueOrLogOfPromiseSetteld(implants)
            ?.filter(({ characterVersionId }) => characterVersionId === characterItem.id)
            .map(({ implantId }) => implantId) ?? []
      });
    }
    return characterVersions;
  }

  public async getWithId(id: number): Promise<CharacterVersionBare | undefined> {
    return (await this.getWithdIds([id]))[0];
  }

  public async getAllWithCharacterName(): Promise<{ id: number; name: string; characterId: number; characterName: string }[]> {
    const connection = await mysqlconnFn();
    const [results] = await connection.execute(`
      SELECT cv.Id as id, cv.Name as name, cv.Character as characterId, c.Name as characterName
      FROM Character_Versions cv
      JOIN Characters c ON c.Id = cv.Character
    `);
    if (!Array.isArray(results)) return [];
    return (results as any[]).filter(
      (r) => typeof r.id === 'number' && typeof r.name === 'string' && typeof r.characterId === 'number' && typeof r.characterName === 'string'
    );
  }

  public async getForCharacter(characterId: number): Promise<CharacterVersionBare[]> {
    const connection = await mysqlconnFn();
    const [results] = await connection.execute(
      `SELECT cv.Id as id, cv.Character as characterId, cv.Name as name, cv.Company as company
       FROM Character_Versions cv WHERE cv.Character = ?`,
      [characterId]
    );
    if (!Array.isArray(results) || results.length === 0) return [];
    const versionIds = (results as any[])
      .map(({ id }) => id)
      .filter((id): id is number => typeof id === 'number');
    const [items, implants, skills] = await Promise.allSettled([
      this.getItemsforCharacterVersions(versionIds),
      this.getImplantsforCharacterVersions(versionIds),
      this.getSkillsForCharacterVerions(versionIds)
    ]);
    const characterVersions: CharacterVersionBare[] = [];
    for (const row of results as any[]) {
      if (typeof row.id !== 'number') continue;
      if (typeof row.characterId !== 'number') continue;
      if (typeof row.name !== 'string') continue;
      characterVersions.push({
        id: row.id,
        characterId: row.characterId,
        name: row.name,
        company: typeof row.company === 'number' ? row.company : null,
        skills:
          valueOrLogOfPromiseSetteld(skills)
            ?.filter(({ characterVersionId }) => characterVersionId === row.id)
            .map(({ skillId, value }) => ({ id: skillId, value })) ?? [],
        items:
          valueOrLogOfPromiseSetteld(items)
            ?.filter(({ characterVersionId }) => characterVersionId === row.id)
            .map(({ itemId, count }) => ({ id: itemId, count })) ?? [],
        implants:
          valueOrLogOfPromiseSetteld(implants)
            ?.filter(({ characterVersionId }) => characterVersionId === row.id)
            .map(({ implantId }) => implantId) ?? []
      });
    }
    return characterVersions;
  }

  private async deleteCharacterVerion(characterVersionId: number): Promise<void> {
    const connection = await mysqlconnFn();
    await connection.query(
      `
			DELETE
      FROM Character_Version cv
      WHERE cv.CharacterVersion in (:characterVersionId)
      `,
      { characterVersionId }
    );
  }

  public async deleteItems(characterVersionId: number): Promise<void> {
    const connection = await mysqlconnFn();
    await connection.query(
      `
			DELETE
      FROM Character_Version_Items cvit
      WHERE cvit.CharacterVersion in (:characterVersionId)
      `,
      { characterVersionId }
    );
  }

  public async deleteImplants(characterVerionId: number): Promise<void> {
    const connection = await mysqlconnFn();
    await connection.query(
      `
			DELETE
      FROM Character_Version_Implants cvim
      WHERE cvim.CharacterVersion in (:characterVerionId)
      `,
      { characterVerionId }
    );
  }

  public async getForUser(userId: number): Promise<CharacterVersionBare[]> {
    const connection = await mysqlconnFn();
    const [results] = await connection.execute(
      `
      SELECT
        cv.Id as id,
        cv.Character as characterId,
        cv.Name as name,
        cv.Company as company
      FROM Character_Versions cv
      JOIN Characters c ON c.Id = cv.Character
      WHERE c.Owner = ?
      `,
      [userId]
    );
    if (Array.isArray(results) === false) return [];
    if (results.length === 0) return [];
    const versionIds = (results as any[])
      .map(({ id }) => id)
      .filter((id): id is number => typeof id === 'number');
    const [items, implants, skills] = await Promise.allSettled([
      this.getItemsforCharacterVersions(versionIds),
      this.getImplantsforCharacterVersions(versionIds),
      this.getSkillsForCharacterVerions(versionIds)
    ]);
    const characterVersions: CharacterVersionBare[] = [];
    for (const row of results as any[]) {
      if ('id' in row === false || typeof row.id != 'number') continue;
      if ('characterId' in row === false || typeof row.characterId != 'number') continue;
      if ('name' in row === false || typeof row.name != 'string') continue;
      characterVersions.push({
        id: row.id,
        characterId: row.characterId,
        name: row.name,
        company: typeof row.company === 'number' ? row.company : null,
        skills:
          valueOrLogOfPromiseSetteld(skills)
            ?.filter(({ characterVersionId }) => characterVersionId === row.id)
            .map(({ skillId, value }) => ({ id: skillId, value })) ?? [],
        items:
          valueOrLogOfPromiseSetteld(items)
            ?.filter(({ characterVersionId }) => characterVersionId === row.id)
            .map(({ itemId, count }) => ({ id: itemId, count })) ?? [],
        implants:
          valueOrLogOfPromiseSetteld(implants)
            ?.filter(({ characterVersionId }) => characterVersionId === row.id)
            .map(({ implantId }) => implantId) ?? []
      });
    }
    return characterVersions;
  }
}
export const characterVersionRepo = new CharacterVersionRepo();

export type CharacterVerionSkill = {
  id: number;
  value: number;
};

export function isCharacterVersionSkill(skill: unknown): skill is CharacterVerionSkill {
  return (
    typeof skill === 'object' &&
    skill != null &&
    'id' in skill &&
    typeof skill.id === 'number' &&
    'value' in skill &&
    typeof skill.value === 'number'
  );
}

export type CharacterVersionItem = {
  id: number;
  count: number;
}

export function isCharacterVersionItem(item: unknown): item is CharacterVersionItem {
  return typeof item === 'object'
    && item != null
    && 'id' in item
    && typeof item.id === 'number'
    && 'count' in item
    && typeof item.count === 'number'
}



export type CharacterVersionBare = {
  id: number | null;
  characterId: number;
  name: string;
  skills: CharacterVerionSkill[];
  items: CharacterVersionItem[];
  implants: number[];
  company: number | null;
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
    'skills' in value &&
    Array.isArray(value.skills) &&
    value.skills.every(isCharacterVersionSkill) &&
    'items' in value &&
    Array.isArray(value.items) &&
    value.items.every(isCharacterVersionItem) &&
    'implants' in value &&
    Array.isArray(value.implants) &&
    value.implants.every((implant) => typeof implant === 'number') &&
    'company' in value &&
    (value.company === null || typeof value.company === 'number')
  );
}

