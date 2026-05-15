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
      `INSERT INTO Character_Versions (Character, Name) VALUES (?, ?)`,
      [characterVersion.characterId, characterVersion.name]
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
      `UPDATE Character_Versions SET Name = ? WHERE Id = ?`,
      [characterVersion.name, versionId]
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
				cv.Name as name
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

  public async getFullVersionsForUser(userId: number): Promise<FullCharacterVersion[]> {
    const connection = await mysqlconnFn();
    const [versionRows] = await connection.execute(
      `SELECT
				cv.Id as versionId,
				cv.Name as versionName,
				c.Id as characterId,
				c.Name as characterName,
				u.Id as ownerId,
				u.Name as ownerName
			FROM Character_Versions cv
			JOIN Characters c ON c.Id = cv.Character
			JOIN Users u ON u.Id = c.Owner
			WHERE c.Owner = ?`,
      [userId]
    );
    if (!Array.isArray(versionRows) || versionRows.length === 0) return [];

    const versionIds = (versionRows as any[])
      .map((r) => r.versionId)
      .filter((id): id is number => typeof id === 'number');
    if (versionIds.length === 0) return [];

    const [items, implants, skills, lastEvents] = await Promise.allSettled([
      this.getItemsforCharacterVersions(versionIds),
      this.getImplantsforCharacterVersions(versionIds),
      this.getSkillsWithGroupForVersions(versionIds),
      this.getLastEventsForVersions(versionIds)
    ]);

    const result: FullCharacterVersion[] = [];
    for (const row of versionRows as any[]) {
      if (typeof row.versionId !== 'number') continue;
      if (typeof row.versionName !== 'string') continue;
      if (typeof row.characterId !== 'number') continue;
      if (typeof row.characterName !== 'string') continue;
      if (typeof row.ownerId !== 'number') continue;
      if (typeof row.ownerName !== 'string') continue;

      const versionSkills =
        valueOrLogOfPromiseSetteld(skills)
          ?.filter((s) => s.characterVersionId === row.versionId)
          .map(({ skillId, groupId, groupName, value }) => ({ id: skillId, group: groupId, groupName, value })) ?? [];

      const versionItems =
        valueOrLogOfPromiseSetteld(items)
          ?.filter((i) => i.characterVersionId === row.versionId)
          .map(({ itemId, count }) => ({ id: itemId, count })) ?? [];

      const versionImplants =
        valueOrLogOfPromiseSetteld(implants)
          ?.filter((i) => i.characterVersionId === row.versionId)
          .map(({ implantId }) => implantId) ?? [];

      const lastEvent =
        valueOrLogOfPromiseSetteld(lastEvents)?.find(
          (e) => e.characterVersionId === row.versionId
        ) ?? null;

      result.push({
        characterId: row.characterId,
        characterName: row.characterName,
        ownerId: row.ownerId,
        ownerName: row.ownerName,
        versionId: row.versionId,
        versionName: row.versionName,
        lastEvent: lastEvent ? { id: lastEvent.eventId, name: lastEvent.eventName } : null,
        skills: versionSkills,
        items: versionItems,
        implants: versionImplants
      });
    }
    return result;
  }

  private async getSkillsWithGroupForVersions(
    ids: number[]
  ): Promise<{ characterVersionId: number; skillId: number; groupId: number; groupName: string; value: number }[]> {
    const connection = await mysqlconnFn();
    const [result] = await connection.query(
      `SELECT
				cvs.CharacterVersion as characterVersionId,
				cvs.Skill as skillId,
				s.Group as groupId,
				sg.Name as groupName,
				cvs.Value as value
			FROM Character_Version_Skills cvs
			JOIN Skills s ON s.Id = cvs.Skill
			JOIN Skill_Groups sg ON sg.Id = s.Group
			WHERE cvs.CharacterVersion IN (?)`,
      [ids]
    );
    if (!Array.isArray(result) || result.length === 0) return [];
    const skills: { characterVersionId: number; skillId: number; groupId: number; groupName: string; value: number }[] =
      [];
    for (const item of result as any[]) {
      if (typeof item.characterVersionId !== 'number') continue;
      if (typeof item.skillId !== 'number') continue;
      if (typeof item.groupId !== 'number') continue;
      if (typeof item.groupName !== 'string') continue;
      if (typeof item.value !== 'number') continue;
      skills.push({
        characterVersionId: item.characterVersionId,
        skillId: item.skillId,
        groupId: item.groupId,
        groupName: item.groupName,
        value: item.value
      });
    }
    return skills;
  }

  private async getLastEventsForVersions(
    ids: number[]
  ): Promise<{ characterVersionId: number; eventId: number; eventName: string }[]> {
    const connection = await mysqlconnFn();
    const [result] = await connection.query(
      `SELECT
				ep.CharacterVersion as characterVersionId,
				e.Id as eventId,
				e.Name as eventName
			FROM Event_Participants ep
			JOIN Events e ON e.Id = ep.Event
			WHERE ep.CharacterVersion IN (?)
			ORDER BY e.StartTime DESC`,
      [ids]
    );
    if (!Array.isArray(result) || result.length === 0) return [];
    const seen = new Set<number>();
    const lastEvents: { characterVersionId: number; eventId: number; eventName: string }[] = [];
    for (const item of result as any[]) {
      if (typeof item.characterVersionId !== 'number') continue;
      if (typeof item.eventId !== 'number') continue;
      if (typeof item.eventName !== 'string') continue;
      if (seen.has(item.characterVersionId)) continue;
      seen.add(item.characterVersionId);
      lastEvents.push({
        characterVersionId: item.characterVersionId,
        eventId: item.eventId,
        eventName: item.eventName
      });
    }
    return lastEvents;
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
    value.implants.every((implant) => typeof implant === 'number')
  );
}

export type FullCharacterVersion = {
  characterId: number;
  characterName: string;
  ownerId: number;
  ownerName: string;
  versionId: number;
  versionName: string;
  lastEvent: { id: number; name: string } | null;
  skills: { id: number; group: number; groupName: string; value: number }[];
  items: { id: number; count: number }[];
  implants: number[];
};
