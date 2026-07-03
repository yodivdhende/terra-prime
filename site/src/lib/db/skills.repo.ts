import { mysqlconnFn } from './mysql';

class SkillRepo {
	public async getAll(): Promise<Skill[]> {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(`
			 SELECT
					s.Id as id,
					s.Name as name,
					s.Description as description,
					s.Cost as cost,
					sg.Id as groupId,
					sg.Name as groupName
				FROM Skills s
				JOIN Skill_Groups sg
					on s.Group = sg.Id
      `);
			if (Array.isArray(result) === false) return [];
			if (result.length === 0) return [];
			const skills: Skill[] = [];
			for (let skillResult of result) {
				if (isSkill(skillResult)) skills.push(skillResult);
				else
					console.error(`%c sql result is not a skill`, `background:red;color:black`, {
						skillResult
					});
			}
			return skills;
		} catch (err) {
			throw err;
		}
	}

	public async getWithId(id: number) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
			 SELECT
					s.Id as id,
					s.Name as name,
					s.Description as description,
					s.Cost as cost,
					sg.Id as groupId,
					sg.Name as groupName
				FROM Skills s
				JOIN Skill_Groups sg
					on s.Group = sg.Id
				WHERE s.id = ?
        `,
				[id]
			);
			if (Array.isArray(result) === false) return null;
			if (result.length === 0) return null;
			const [skill] = result;
			if (isSkill(skill) === false) return null;
			return skill;
		} catch (err) {
			throw err;
		}
	}

	public async getWithIds(ids: number[]): Promise<Skill[]> {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
				SELECT
					s.Id,
					s.Name,
					s.Description,
					sg.Id,
					sg.Name
				FROM Skills s
				JOIN Skill_Groups sg
					on s.Group = sg.Id
				WHERE s.Id in :ids 
        `,
				{ids}
			);
			if (Array.isArray(result) === false) return [];
			if (result.length === 0) return [];
			const skills: Skill[] = [];
			for (let skillResult of result) {
				if (isSkill(skillResult)) skills.push(skillResult);
				else
					console.error(`%c sql result is not a skill`, `background:red;color:black`, {
						skillResult
					});
			}
			return skills;
		} catch (err) {
			throw err;
		}
	}

	public save(item: Skill) {
		if (item.id == null) return this.create(item);
		return this.edit(item);
	}

	public async create({
		name,
		description,
		groupId,
		cost
	}: Pick<Skill, 'name' | 'description' | 'groupId' | 'cost'>) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
				 INSERT INTO Skills (Name, Description, \`Group\`, Cost)
				Values (?,?,?,?)
        `,
				[name, description, groupId, cost ?? 0]
			);
			if (Array.isArray(result) === false) return null;
			if (result.length === 0) return null;
			const [skill] = result;
			if (isSkill(skill) === false) return null;
			return skill;
		} catch (err) {
			throw err;
		}
	}

	public async edit({
		id,
		name,
		description,
		groupId,
		cost
	}: Pick<Skill, 'id' | 'name' | 'description' | 'groupId' | 'cost'>) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
				UPDATE Skills
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
			const [skill] = result;
			if (isSkill(skill) === false) return null;
			return skill;
		} catch (err) {
			throw err;
		}
	}

	public async delete({ id }: { id: number }) {
		try {
			const connection = mysqlconnFn();
			await connection.execute(
				`
                DELETE 
                FROM Skills
                WHERE Id = ?
            `,
				[id]
			);
		} catch (err) {
			throw err;
		}
	}


	public async getAllGroups() {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(`
			 SELECT
					sg.Id as id,
					sg.Name as name,
					sg.Description as description
				FROM Skill_Groups sg
      `);
			if (Array.isArray(result) === false) return [];
			if (result.length === 0) return [];
			const skillGroups: SkillGroup[] = [];
			for (let skillGroupResult of result) {
				if (isSkillGroup(skillGroupResult)) skillGroups.push(skillGroupResult);
				else
					console.error(`%c sql result is not a skillGroup`, `background:red;color:black`, {
						skillGroupResult
					});
			}
			return skillGroups;
		} catch (err) {
			throw err;
		}
	}

	public async getGroupWithId(id: number) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
			 SELECT
					sg.Id as id,
					sg.Name as name,
					sg.Description as description
				FROM Skill_Groups sg
				WHERE sg.Id = ?
      `,
				[id]
			);
			if (Array.isArray(result) === false) return [];
			const [skillGroupResult] = result;
			if (isSkillGroup(skillGroupResult) === false) return null;
			return skillGroupResult;
		} catch (err) {
			throw err;
		}
	}

	public saveSkillGroup(skillGroup: SkillGroup) {
		if (skillGroup.id == null) return this.createSkillGroup(skillGroup);
		return this.editSkillGroup(skillGroup);
	}

	private async createSkillGroup({ name, description }: Pick<SkillGroup, 'name' | 'description'>) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
				INSERT INTO Skill_Groups (Name, Description)
				VALUES (?,?)
      `,
				[name, description]
			);
			if ('serverStatus' in result && result.serverStatus !== 2) return null;
			if ('insertId' in result === false || result.insertId == null) return null;
			return result.insertId;
		} catch (err) {
			throw err;
		}
	}

	private async editSkillGroup({
		id,
		name,
		description
	}: Pick<SkillGroup, 'id' | 'name' | 'description'>) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
				UPDATE Skill_Groups
				SET Name = ?,
				Description = ?
				WHERE Id = ?
      `,
				[name, description, id]
			);
			if ('serverStatus' in result && result.serverStatus !== 2) return null;
			return id;
		} catch (err) {
			throw err;
		}
	}

	public async deleteSkillGroup(groupId: number) {
		const SkillsDeleted = (await this.deleteAllSkillsWithGroup(groupId)) !== null;
		if (SkillsDeleted) await this.deleteSkillGroupWithId(groupId);
	}

	private async deleteAllSkillsWithGroup(groupId: number) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
				DELETE
				FROM Skills
				WHERE \`Group\` = ?
      `,
				[groupId]
			);
			if ('serverStatus' in result && result.serverStatus !== 2) return null;
			return groupId;
		} catch (err) {
			throw err;
		}
	}

	private async deleteSkillGroupWithId(groupId: number) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
				DELETE
				FROM Skill_Groups
				WHERE Id = ?
      `,
				[groupId]
			);
			if ('serverStatus' in result && result.serverStatus !== 2) return null;
			return groupId;
		} catch (err) {
			throw err;
		}
	}

}
export const skillRepo = new SkillRepo();

export type Skill = {
	id: number | null;
	name: string;
	description: string;
	groupId: number;
	groupName: string;
	cost?: number;
};

export function isSkill(skill: unknown): skill is Skill {
	return (
		typeof skill === 'object' &&
		skill !== null &&
		'name' in skill &&
		typeof skill.name === 'string' &&
		'description' in skill &&
		typeof skill.description === 'string' &&
		'groupId' in skill &&
		typeof skill.groupId === 'number' &&
		'groupName' in skill &&
		typeof skill.groupName === 'string' &&
		'id' in skill &&
		(typeof skill.id === 'number' || skill.id === null)
	);
}

export type SkillGroup = {
	id: number | null;
	name: string;
	description: string;
};

export function isSkillGroup(group: unknown): group is SkillGroup {
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
