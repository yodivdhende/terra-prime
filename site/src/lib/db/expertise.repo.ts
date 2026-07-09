import { mysqlconnFn } from './mysql';

class ExpertiseRepo {
	public async getAll(): Promise<Expertise[]> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(`
		 SELECT
				e.Id as id,
				e.Name as name,
				e.Description as description,
				e.Cost as cost,
				e.CharacterAccess as characterAccess,
				eg.Id as groupId,
				eg.Name as groupName
			FROM Expertise e
			JOIN Expertise_Groups eg
				on e.Group = eg.Id
    `);
		if (Array.isArray(result) === false) return [];
		if (result.length === 0) return [];
		const expertise: Expertise[] = [];
		for (const expertiseResult of result) {
			if (isExpertise(expertiseResult))
				expertise.push({ ...expertiseResult, allowedCharacterIds: [] });
			else
				console.error(`%c sql result is not an expertise`, `background:red;color:black`, {
					expertiseResult
				});
		}
		return expertise;
	}

	public async getAllForCharacter(characterId: number): Promise<Expertise[]> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
		 SELECT
				e.Id as id,
				e.Name as name,
				e.Description as description,
				e.Cost as cost,
				e.CharacterAccess as characterAccess,
				eg.Id as groupId,
				eg.Name as groupName
			FROM Expertise e
			JOIN Expertise_Groups eg
				on e.Group = eg.Id
			WHERE e.CharacterAccess = 'all'
			  OR (e.CharacterAccess = 'specific' AND EXISTS (
			    SELECT 1 FROM Expertise_Character_Access eca
			    WHERE eca.ExpertiseId = e.Id AND eca.CharacterId = ?
			  ))
      `,
			[characterId]
		);
		if (Array.isArray(result) === false) return [];
		if (result.length === 0) return [];
		const expertise: Expertise[] = [];
		for (const expertiseResult of result) {
			if (isExpertise(expertiseResult))
				expertise.push({ ...expertiseResult, allowedCharacterIds: [] });
			else
				console.error(`%c sql result is not an expertise`, `background:red;color:black`, {
					expertiseResult
				});
		}
		return expertise;
	}

	public async getAllAccessibleToAll(): Promise<Expertise[]> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(`
		 SELECT
				e.Id as id,
				e.Name as name,
				e.Description as description,
				e.Cost as cost,
				e.CharacterAccess as characterAccess,
				eg.Id as groupId,
				eg.Name as groupName
			FROM Expertise e
			JOIN Expertise_Groups eg
				on e.Group = eg.Id
			WHERE e.CharacterAccess = 'all'
    `);
		if (Array.isArray(result) === false) return [];
		if (result.length === 0) return [];
		const expertise: Expertise[] = [];
		for (const expertiseResult of result) {
			if (isExpertise(expertiseResult))
				expertise.push({ ...expertiseResult, allowedCharacterIds: [] });
			else
				console.error(`%c sql result is not an expertise`, `background:red;color:black`, {
					expertiseResult
				});
		}
		return expertise;
	}

	public async getWithId(id: number) {
		const connection = mysqlconnFn();
		const [[result], [accessRows]] = await Promise.all([
			connection.execute(
				`
		 SELECT
				e.Id as id,
				e.Name as name,
				e.Description as description,
				e.Cost as cost,
				e.CharacterAccess as characterAccess,
				eg.Id as groupId,
				eg.Name as groupName
			FROM Expertise e
			JOIN Expertise_Groups eg
				on e.Group = eg.Id
			WHERE e.id = ?
      `,
				[id]
			),
			connection.execute(
				`SELECT CharacterId as characterId FROM Expertise_Character_Access WHERE ExpertiseId = ?`,
				[id]
			)
		]);
		if (Array.isArray(result) === false) return null;
		if (result.length === 0) return null;
		const [expertise] = result;
		if (isExpertise(expertise) === false) return null;
		const allowedCharacterIds = Array.isArray(accessRows)
			? (accessRows as { characterId: number }[]).map((r) => r.characterId)
			: [];
		return { ...expertise, allowedCharacterIds };
	}

	public async getWithIds(ids: number[]): Promise<Expertise[]> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
			SELECT
				e.Id,
				e.Name,
				e.Description,
				e.CharacterAccess as characterAccess,
				eg.Id,
				eg.Name
			FROM Expertise e
			JOIN Expertise_Groups eg
				on e.Group = eg.Id
			WHERE e.Id in :ids
      `,
			{ ids }
		);
		if (Array.isArray(result) === false) return [];
		if (result.length === 0) return [];
		const expertise: Expertise[] = [];
		for (const expertiseResult of result) {
			if (isExpertise(expertiseResult))
				expertise.push({ ...expertiseResult, allowedCharacterIds: [] });
			else
				console.error(`%c sql result is not an expertise`, `background:red;color:black`, {
					expertiseResult
				});
		}
		return expertise;
	}

	public async setCharacterAccess(
		id: number,
		access: Expertise['characterAccess'],
		characterIds: number[]
	) {
		const conn = await mysqlconnFn().getConnection();
		try {
			await conn.beginTransaction();
			await conn.execute(`UPDATE Expertise SET CharacterAccess = ? WHERE Id = ?`, [
				access ?? 'all',
				id
			]);
			await conn.execute(`DELETE FROM Expertise_Character_Access WHERE ExpertiseId = ?`, [id]);
			if (access === 'specific' && characterIds.length > 0) {
				const placeholders = characterIds.map(() => '(?,?)').join(',');
				const values = characterIds.flatMap((cid) => [id, cid]);
				await conn.execute(
					`INSERT INTO Expertise_Character_Access (ExpertiseId, CharacterId) VALUES ${placeholders}`,
					values
				);
			}
			await conn.commit();
		} catch (err) {
			await conn.rollback();
			throw err;
		} finally {
			conn.release();
		}
	}

	public save(item: Expertise) {
		if (item.id == null) return this.create(item);
		return this.edit(item);
	}

	public async saveBulk(items: Expertise[]) {
		const toCreate = items.filter((i) => i.id == null);
		const toUpdate = items.filter((i) => i.id != null);
		const conn = await mysqlconnFn().getConnection();
		try {
			await conn.beginTransaction();
			if (toCreate.length > 0) {
				const placeholders = toCreate.map(() => '(?,?,?,?)').join(',');
				const values = toCreate.flatMap((i) => [i.name, i.description, i.groupId, i.cost ?? 0]);
				await conn.execute(
					`INSERT INTO Expertise (Name, Description, \`Group\`, Cost) VALUES ${placeholders}`,
					values
				);
			}
			if (toUpdate.length > 0) {
				const placeholders = toUpdate.map(() => '(?,?,?,?,?)').join(',');
				const values = toUpdate.flatMap((i) => [
					i.id,
					i.name,
					i.description,
					i.groupId,
					i.cost ?? 0
				]);
				await conn.execute(
					`INSERT INTO Expertise (Id, Name, Description, \`Group\`, Cost) VALUES ${placeholders}
					 ON DUPLICATE KEY UPDATE Name=VALUES(Name), Description=VALUES(Description), \`Group\`=VALUES(\`Group\`), Cost=VALUES(Cost)`,
					values
				);
			}
			await conn.commit();
		} catch (err) {
			await conn.rollback();
			throw err;
		} finally {
			conn.release();
		}
	}

	public async create({
		name,
		description,
		groupId,
		cost
	}: Pick<Expertise, 'name' | 'description' | 'groupId' | 'cost'>) {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
			 INSERT INTO Expertise (Name, Description, \`Group\`, Cost)
			Values (?,?,?,?)
      `,
			[name, description, groupId, cost ?? 0]
		);
		if (Array.isArray(result) === false) return null;
		if (result.length === 0) return null;
		const [expertise] = result;
		if (isExpertise(expertise) === false) return null;
		return expertise;
	}

	public async edit({
		id,
		name,
		description,
		groupId,
		cost
	}: Pick<Expertise, 'id' | 'name' | 'description' | 'groupId' | 'cost'>) {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
			UPDATE Expertise
			SET Name = ?,
			Description = ?,
			\`Group\` = ?,
			Cost = ?
			WHERE Id = ?
      `,
			[name, description, groupId, cost ?? 0, id]
		);
		if (Array.isArray(result) === false) return null;
		if (result.length === 0) return null;
		const [expertise] = result;
		if (isExpertise(expertise) === false) return null;
		return expertise;
	}

	public async delete({ id }: { id: number }) {
		const connection = mysqlconnFn();
		await connection.execute(`DELETE FROM Expertise_Character_Access WHERE ExpertiseId = ?`, [id]);
		await connection.execute(
			`
              DELETE
              FROM Expertise
              WHERE Id = ?
          `,
			[id]
		);
	}

	public async getAllGroups() {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(`
		 SELECT
				eg.Id as id,
				eg.Name as name,
				eg.Description as description
			FROM Expertise_Groups eg
    `);
		if (Array.isArray(result) === false) return [];
		if (result.length === 0) return [];
		const expertiseGroups: ExpertiseGroup[] = [];
		for (const expertiseGroupResult of result) {
			if (isExpertiseGroup(expertiseGroupResult)) expertiseGroups.push(expertiseGroupResult);
			else
				console.error(`%c sql result is not an expertiseGroup`, `background:red;color:black`, {
					expertiseGroupResult
				});
		}
		return expertiseGroups;
	}

	public async getGroupWithId(id: number) {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
		 SELECT
				eg.Id as id,
				eg.Name as name,
				eg.Description as description
			FROM Expertise_Groups eg
			WHERE eg.Id = ?
    `,
			[id]
		);
		if (Array.isArray(result) === false) return [];
		const [expertiseGroupResult] = result;
		if (isExpertiseGroup(expertiseGroupResult) === false) return null;
		return expertiseGroupResult;
	}

	public saveExpertiseGroup(expertiseGroup: ExpertiseGroup) {
		if (expertiseGroup.id == null) return this.createExpertiseGroup(expertiseGroup);
		return this.editExpertiseGroup(expertiseGroup);
	}

	private async createExpertiseGroup({
		name,
		description
	}: Pick<ExpertiseGroup, 'name' | 'description'>) {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
			INSERT INTO Expertise_Groups (Name, Description)
			VALUES (?,?)
    `,
			[name, description]
		);
		if ('serverStatus' in result && result.serverStatus !== 2) return null;
		if ('insertId' in result === false || result.insertId == null) return null;
		return result.insertId;
	}

	private async editExpertiseGroup({
		id,
		name,
		description
	}: Pick<ExpertiseGroup, 'id' | 'name' | 'description'>) {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
			UPDATE Expertise_Groups
			SET Name = ?,
			Description = ?
			WHERE Id = ?
    `,
			[name, description, id]
		);
		if ('serverStatus' in result && result.serverStatus !== 2) return null;
		return id;
	}

	public async deleteExpertiseGroup(groupId: number) {
		const expertiseDeleted = (await this.deleteAllExpertiseWithGroup(groupId)) !== null;
		if (expertiseDeleted) await this.deleteExpertiseGroupWithId(groupId);
	}

	private async deleteAllExpertiseWithGroup(groupId: number) {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
			DELETE
			FROM Expertise
			WHERE \`Group\` = ?
    `,
			[groupId]
		);
		if ('serverStatus' in result && result.serverStatus !== 2) return null;
		return groupId;
	}

	private async deleteExpertiseGroupWithId(groupId: number) {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
			DELETE
			FROM Expertise_Groups
			WHERE Id = ?
    `,
			[groupId]
		);
		if ('serverStatus' in result && result.serverStatus !== 2) return null;
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
	cost?: number;
	characterAccess?: 'all' | 'none' | 'specific';
	allowedCharacterIds?: number[];
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
		(typeof expertise.id === 'number' || expertise.id === null)
	);
}

export type ExpertiseGroup = {
	id: number | null;
	name: string;
	description: string;
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
		(typeof group.id === 'number' || group.id === null)
	);
}
