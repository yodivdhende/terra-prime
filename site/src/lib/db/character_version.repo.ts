import { valueOrLogOfPromiseSetteld } from '$lib/utils/request';
import type { RowDataPacket } from 'mysql2/promise';
import { mysqlconnFn } from './mysql';
import { eventParticipantsRepo } from './event_participants.repo';

class CharacterVersionRepo {
  public async getAll(): Promise<CharacterVersionBare[]> {
    const connection = mysqlconnFn();
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
    const ids = (results as RowDataPacket[]).map(({ id }) => id).filter((id): id is number => typeof id === 'number');
    const [items, implants, expertise] = await Promise.allSettled([
      this.getItemsforCharacterVersions(ids),
      this.getImplantsforCharacterVersions(ids),
      this.getExpertiseForCharacterVersions(ids)
    ]);
    const characterVersions: CharacterVersionBare[] = [];
    for (const characterItem of results as RowDataPacket[]) {
      if ('id' in characterItem === false || typeof characterItem.id != 'number') continue;
      if ('characterId' in characterItem === false || typeof characterItem.characterId != 'number')
        continue;
      if ('name' in characterItem === false || typeof characterItem.name != 'string') continue;
      if (typeof characterItem.company !== 'number') continue;
      characterVersions.push({
        id: characterItem.id,
        characterId: characterItem.characterId,
        name: characterItem.name,
        company: characterItem.company,
        expertise:
          expertise.status === 'fulfilled'
            ? expertise.value
              .filter(({ characterVersionId }) => characterVersionId === characterItem.id)
              .map(({ expertiseId, value }) => ({ id: expertiseId, value }))
            : [],
        items:
          items.status === 'fulfilled'
            ? items.value
              .filter(({ characterVersionId }) => characterVersionId === characterItem.id)
              .map(({ itemId, count }) => ({ id: itemId, count }))
            : [],
        implants:
          implants.status === 'fulfilled'
            ? implants.value
              .filter(({ characterVersionId }) => characterVersionId === characterItem.id)
              .map(({ implantId, slot }) => ({ id: implantId, slot }))
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
    const connection = mysqlconnFn();
    const [result] = await connection.execute(
      `INSERT INTO Character_Versions (\`Character\`, Name, Company) VALUES (?, ?, ?)`,
      [characterVersion.characterId, characterVersion.name, characterVersion.company]
    );
    const versionId = (result as { insertId: number }).insertId;
    await Promise.all([
      characterVersion.expertise.length > 0 ? this.saveExpertise({ versionId, expertise: characterVersion.expertise }) : Promise.resolve(),
      characterVersion.items.length > 0 ? this.saveItems({ versionId, items: characterVersion.items }) : Promise.resolve(),
      characterVersion.implants.length > 0 ? this.saveImplants({ versionId, implants: characterVersion.implants }) : Promise.resolve(),
    ]);
    return versionId;
  }

  public async update(characterVersion: CharacterVersionBare): Promise<number> {
    if (characterVersion.id == null) throw new Error('update requires an id');
    const versionId = characterVersion.id;
    const connection = mysqlconnFn();
    await connection.execute(
      `UPDATE Character_Versions SET Name = ?, Company = ? WHERE Id = ?`,
      [characterVersion.name, characterVersion.company, versionId]
    );
    await Promise.all([
      this.deleteItems(versionId),
      this.deleteImplants(versionId),
      this.deleteExpertise(versionId)
    ]);
    await Promise.all([
      characterVersion.expertise.length > 0 ? this.saveExpertise({ versionId, expertise: characterVersion.expertise }) : Promise.resolve(),
      characterVersion.items.length > 0 ? this.saveItems({ versionId, items: characterVersion.items }) : Promise.resolve(),
      characterVersion.implants.length > 0 ? this.saveImplants({ versionId, implants: characterVersion.implants }) : Promise.resolve(),
    ]);
    return versionId;
  }

  public async delete(characterVersionId: number): Promise<void> {
    await Promise.all([
      this.deleteItems(characterVersionId),
      this.deleteImplants(characterVersionId),
      this.deleteExpertise(characterVersionId),
      eventParticipantsRepo.deleteForCharacterVersion(characterVersionId),
    ]);
    await this.deleteCharacterVerion(characterVersionId);
  }

  public async getItemsforCharacterVersions(
    ids: number[]
  ): Promise<{ characterVersionId: number; itemId: number, count: number }[]> {
    const connection = mysqlconnFn();
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
  ): Promise<{ characterVersionId: number; implantId: number; slot: number }[]> {
    const connection = mysqlconnFn();
    const [result] = await connection.query(
      `
      SELECT
        cvim.CharacterVersion as characterVersionId,
        cvim.Implant as implantId,
        cvim.Slot as slot
      FROM Character_Version_Implants cvim
      WHERE cvim.CharacterVersion in (:ids)
      `,
      { ids }
    );
    if (Array.isArray(result) === false) return [];
    if (result.length === 0) return [];
    const implants: { characterVersionId: number; implantId: number; slot: number }[] = [];
    for (const item of result) {
      if ('characterVersionId' in item === false || typeof item.characterVersionId !== 'number')
        continue;
      if ('implantId' in item === false || typeof item.implantId != 'number') continue;
      if ('slot' in item === false || typeof item.slot != 'number') continue;
      implants.push({ characterVersionId: item.characterVersionId, implantId: item.implantId, slot: item.slot });
    }
    return implants;
  }

  public async getExpertiseForCharacterVersions(
    ids: number[]
  ): Promise<{ characterVersionId: number; expertiseId: number; value: number }[]> {
    const connection = mysqlconnFn();
    const [result] = await connection.query(
      `
      SELECT
        cve.CharacterVersion as characterVersionId,
        cve.Expertise as expertiseId,
        cve.Value as value
      FROM Character_Version_Expertise cve
      WHERE cve.CharacterVersion in (:ids)
      `,
      { ids }
    );
    if (Array.isArray(result) === false) return [];
    if (result.length === 0) return [];
    const expertise: { characterVersionId: number; expertiseId: number; value: number }[] = [];
    for (const item of result) {
      if ('characterVersionId' in item === false || typeof item.characterVersionId !== 'number')
        continue;
      if ('expertiseId' in item === false || typeof item.expertiseId != 'number') continue;
      if ('value' in item === false || typeof item.value != 'number') continue;
      expertise.push({
        characterVersionId: item.characterVersionId,
        expertiseId: item.expertiseId,
        value: item.value
      });
    }
    return expertise;
  }

  public async saveExpertise({
    versionId,
    expertise
  }: {
    versionId: number;
    expertise: CharacterVersionExpertise[];
  }) {
    this.deleteExpertise(versionId);
    const connection = mysqlconnFn();
    await connection.query(
      `
				INSERT INTO Character_Version_Expertise (CharacterVersion, Expertise, Value)
				VALUES ?
			`,
      [expertise.map((e) => [versionId, e.id, e.value])]
    );
  }

  public async saveItems({ versionId, items }: { versionId: number; items: CharacterVersionItem[] }) {
    const connection = mysqlconnFn();
    await connection.query(
      `INSERT INTO Character_Version_Items (CharacterVersion, Item, Count) VALUES ?`,
      [items.map((item) => [versionId, item.id, item.count])]
    );
  }

  public async saveImplants({ versionId, implants }: { versionId: number; implants: CharacterVersionImplant[] }) {
    const connection = mysqlconnFn();
    await connection.query(
      `INSERT INTO Character_Version_Implants (CharacterVersion, Implant, Slot) VALUES ?`,
      [implants.map((i) => [versionId, i.id, i.slot])]
    );
  }

  private async deleteExpertise(versionId: number): Promise<void> {
    const connection = mysqlconnFn();
    await connection.query(
      `DELETE FROM Character_Version_Expertise cve WHERE cve.CharacterVersion = ?`,
      [versionId]
    );
  }

  public async getWithdIds(ids: number[]): Promise<CharacterVersionBare[]> {
    const connection = mysqlconnFn();
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
    const existingIds = (results as RowDataPacket[]).map(({ id }) => id).filter((id): id is number => typeof id === 'number');
    const [items, implants, expertise] = await Promise.allSettled([
      this.getItemsforCharacterVersions(existingIds),
      this.getImplantsforCharacterVersions(existingIds),
      this.getExpertiseForCharacterVersions(existingIds)
    ]);
    const characterVersions: CharacterVersionBare[] = [];
    for (const characterItem of results as RowDataPacket[]) {
      if ('id' in characterItem === false || typeof characterItem.id != 'number') continue;
      if ('characterId' in characterItem === false || typeof characterItem.characterId != 'number')
        continue;
      if ('name' in characterItem === false || typeof characterItem.name != 'string') continue;
      if (typeof characterItem.company !== 'number') continue;
      characterVersions.push({
        id: characterItem.id,
        characterId: characterItem.characterId,
        name: characterItem.name,
        company: characterItem.company,
        expertise:
          valueOrLogOfPromiseSetteld(expertise)
            ?.filter(({ characterVersionId }) => characterVersionId === characterItem.id)
            .reduce((acc, { expertiseId, value }) => {
              if (!acc.some((e) => e.id === expertiseId)) acc.push({ id: expertiseId, value });
              return acc;
            }, [] as CharacterVersionExpertise[]) ?? [],
        items:
          valueOrLogOfPromiseSetteld(items)
            ?.filter(({ characterVersionId }) => characterVersionId === characterItem.id)
            .reduce((acc, { itemId, count }) => {
              const existing = acc.find((i) => i.id === itemId);
              if (existing) existing.count += count;
              else acc.push({ id: itemId, count });
              return acc;
            }, [] as CharacterVersionItem[]) ?? [],
        implants:
          valueOrLogOfPromiseSetteld(implants)
            ?.filter(({ characterVersionId }) => characterVersionId === characterItem.id)
            .reduce((acc, { implantId, slot }) => {
              if (!acc.some((i) => i.id === implantId)) acc.push({ id: implantId, slot });
              return acc;
            }, [] as CharacterVersionImplant[]) ?? []
      });
    }
    return characterVersions;
  }

  public async getWithId(id: number): Promise<CharacterVersionBare | undefined> {
    return (await this.getWithdIds([id]))[0];
  }

  public async getAllWithCharacterName(): Promise<{ id: number; name: string; characterId: number; characterName: string; ownerName: string }[]> {
    const connection = mysqlconnFn();
    const [results] = await connection.execute(`
      SELECT cv.Id as id, cv.Name as name, cv.Character as characterId, c.Name as characterName, u.Name as ownerName
      FROM Character_Versions cv
      JOIN Characters c ON c.Id = cv.Character
      JOIN Users u ON u.Id = c.Owner
    `);
    if (!Array.isArray(results)) return [];
    return (results as RowDataPacket[]).filter(
      (r) =>
        typeof r.id === 'number' &&
        typeof r.name === 'string' &&
        typeof r.characterId === 'number' &&
        typeof r.characterName === 'string' &&
        typeof r.ownerName === 'string'
    ) as { id: number; name: string; characterId: number; characterName: string; ownerName: string }[];
  }

  public async getForCharacter(characterId: number): Promise<CharacterVersionBare[]> {
    const connection = mysqlconnFn();
    const [results] = await connection.execute(
      `SELECT cv.Id as id, cv.Character as characterId, cv.Name as name, cv.Company as company
       FROM Character_Versions cv WHERE cv.Character = ?`,
      [characterId]
    );
    if (!Array.isArray(results) || results.length === 0) return [];
    const versionIds = (results as RowDataPacket[])
      .map(({ id }) => id)
      .filter((id): id is number => typeof id === 'number');
    const [items, implants, expertise] = await Promise.allSettled([
      this.getItemsforCharacterVersions(versionIds),
      this.getImplantsforCharacterVersions(versionIds),
      this.getExpertiseForCharacterVersions(versionIds)
    ]);
    const characterVersions: CharacterVersionBare[] = [];
    for (const row of results as RowDataPacket[]) {
      if (typeof row.id !== 'number') continue;
      if (typeof row.characterId !== 'number') continue;
      if (typeof row.name !== 'string') continue;
      if (typeof row.company !== 'number') continue;
      characterVersions.push({
        id: row.id,
        characterId: row.characterId,
        name: row.name,
        company: row.company,
        expertise:
          valueOrLogOfPromiseSetteld(expertise)
            ?.filter(({ characterVersionId }) => characterVersionId === row.id)
            .map(({ expertiseId, value }) => ({ id: expertiseId, value })) ?? [],
        items:
          valueOrLogOfPromiseSetteld(items)
            ?.filter(({ characterVersionId }) => characterVersionId === row.id)
            .map(({ itemId, count }) => ({ id: itemId, count })) ?? [],
        implants:
          valueOrLogOfPromiseSetteld(implants)
            ?.filter(({ characterVersionId }) => characterVersionId === row.id)
            .map(({ implantId, slot }) => ({ id: implantId, slot })) ?? []
      });
    }
    return characterVersions;
  }

  private async deleteCharacterVerion(characterVersionId: number): Promise<void> {
    const connection = mysqlconnFn();
    await connection.query(
      `
			DELETE
      FROM Character_Versions
      WHERE Id = :characterVersionId
      `,
      { characterVersionId }
    );
  }

  public async deleteItems(characterVersionId: number): Promise<void> {
    const connection = mysqlconnFn();
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
    const connection = mysqlconnFn();
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
    const connection = mysqlconnFn();
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
    const versionIds = (results as RowDataPacket[])
      .map(({ id }) => id)
      .filter((id): id is number => typeof id === 'number');
    const [items, implants, expertise] = await Promise.allSettled([
      this.getItemsforCharacterVersions(versionIds),
      this.getImplantsforCharacterVersions(versionIds),
      this.getExpertiseForCharacterVersions(versionIds)
    ]);
    const characterVersions: CharacterVersionBare[] = [];
    for (const row of results as RowDataPacket[]) {
      if ('id' in row === false || typeof row.id != 'number') continue;
      if ('characterId' in row === false || typeof row.characterId != 'number') continue;
      if ('name' in row === false || typeof row.name != 'string') continue;
      if (typeof row.company !== 'number') continue;
      characterVersions.push({
        id: row.id,
        characterId: row.characterId,
        name: row.name,
        company: row.company,
        expertise:
          valueOrLogOfPromiseSetteld(expertise)
            ?.filter(({ characterVersionId }) => characterVersionId === row.id)
            .map(({ expertiseId, value }) => ({ id: expertiseId, value })) ?? [],
        items:
          valueOrLogOfPromiseSetteld(items)
            ?.filter(({ characterVersionId }) => characterVersionId === row.id)
            .map(({ itemId, count }) => ({ id: itemId, count })) ?? [],
        implants:
          valueOrLogOfPromiseSetteld(implants)
            ?.filter(({ characterVersionId }) => characterVersionId === row.id)
            .map(({ implantId, slot }) => ({ id: implantId, slot })) ?? []
      });
    }
    return characterVersions;
  }
}
export const characterVersionRepo = new CharacterVersionRepo();

export type CharacterVersionExpertise = {
  id: number;
  value: number;
};

export function isCharacterVersionExpertise(expertise: unknown): expertise is CharacterVersionExpertise {
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
}

export function isCharacterVersionItem(item: unknown): item is CharacterVersionItem {
  return typeof item === 'object'
    && item != null
    && 'id' in item
    && typeof item.id === 'number'
    && 'count' in item
    && typeof item.count === 'number'
}



export type CharacterVersionImplant = {
  id: number;
  slot: number;
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
