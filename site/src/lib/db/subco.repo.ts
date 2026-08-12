import { mysqlconnFn } from './mysql';

class SubcoRepo {
	public async getAll(): Promise<Subco[]> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(`
              SELECT
                  s.Id as id,
                  s.Name as name,
                  s.Company as company,
                  s.BackstoryId as backstoryId,
                  sm.Member as member
              FROM Subco s
              JOIN Subco_Members sm
                  on sm.Subco = s.Id
          `);
		return collectSubcos(result);
	}

	public async getWithId(id: number): Promise<Subco | undefined> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
              SELECT
                  s.Id as id,
                  s.Name as name,
                  s.Company as company,
                  s.BackstoryId as backstoryId,
                  sm.Member as member
              FROM Subco s
              JOIN Subco_Members sm
                  on sm.Subco = s.Id
              WHERE s.Id = ?
          `,
			[id]
		);
		return collectSubcos(result)[0];
	}

	public save(subco: Subco) {
		if (subco.id == null) return this.create(subco);
		return this.edit(subco);
	}

	public async create({ name, company, backstoryId, members }: Omit<Subco, 'id'>) {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
              INSERT INTO Subco (Name, Company, BackstoryId)
              VALUES (?, ?, ?)
          `,
			[name, company, backstoryId ?? null]
		);
		if ('serverStatus' in result && result.serverStatus !== 2) return null;
		if ('insertId' in result === false || result.insertId == null) return null;
		const subcoId = result.insertId;
		await this.replaceMembers({ subcoId, members });
		return subcoId;
	}

	public async edit({ id, name, company, backstoryId, members }: Subco) {
		if (id == null) return null;
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
              UPDATE Subco
              SET Name = ?, Company = ?, BackstoryId = ?
              WHERE Id = ?
          `,
			[name, company, backstoryId ?? null, id]
		);
		if ('serverStatus' in result && result.serverStatus !== 2) return null;
		await this.replaceMembers({ subcoId: id, members });
		return id;
	}

	public async saveBackstoryId(id: number, backstoryId: string) {
		const connection = mysqlconnFn();
		await connection.execute(`UPDATE Subco SET BackstoryId = ? WHERE Id = ?`, [backstoryId, id]);
	}

	private async replaceMembers({ subcoId, members }: { subcoId: number; members: number[] }) {
		const connection = mysqlconnFn();
		await connection.execute(
			`
              DELETE
              FROM Subco_Members
              WHERE Subco = ?
          `,
			[subcoId]
		);
		if (members.length === 0) return;
		const placeholders = members.map(() => `(?, ?)`).join(', ');
		const values = members.flatMap((member) => [subcoId, member]);
		await connection.execute(
			`
              INSERT INTO Subco_Members (Subco, Member)
              VALUES ${placeholders}
              `,
			values
		);
	}

	public async delete({ id }: { id: number }) {
		const connection = mysqlconnFn();
		await connection.execute(
			`
              DELETE
              FROM Subco_Members
              WHERE Subco = ?
          `,
			[id]
		);
		await connection.execute(
			`
              DELETE
              FROM Subco
              WHERE Id = ?
          `,
			[id]
		);
	}

	public async getForUser(userId: number): Promise<Subco[]> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
              SELECT
                  s.Id as id,
                  s.Name as name,
                  s.Company as company,
                  s.BackstoryId as backstoryId,
                  sm.Member as member
              FROM Subco s
              JOIN Subco_Members sm
                  on sm.Subco = s.Id
              WHERE s.id in (
                  SELECT sm2.Subco
                  FROM Subco_Members sm2
                  JOIN Characters c
                      on c.Id = sm2.Member
                  WHERE c.Owner = ?
              )
          `,
			[userId]
		);
		return collectSubcos(result);
	}

	public async getForCharacter({
		characterId
	}: {
		characterId: number;
	}): Promise<Subco | undefined> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
              SELECT
                  s.Id as id,
                  s.Name as name,
                  s.Company as company,
                  s.BackstoryId as backstoryId,
                  sm.Member as member
              FROM Subco s
              JOIN Subco_Members sm
                  on sm.Subco = s.Id
              WHERE s.id in (
                  SELECT sm2.Subco
                  FROM Subco_Members sm2
                  WHERE sm2.Member = ?
              )
          `,
			[characterId]
		);
		return collectSubcos(result)[0];
	}
}

function collectSubcos(result: unknown): Subco[] {
	if (Array.isArray(result) === false) return [];
	if (result.length === 0) return [];
	const subcos: Subco[] = [];
	for (const subcoLine of result) {
		if (isSubcoLine(subcoLine)) {
			const existing = subcos.find((subco) => subco.id === subcoLine.id);
			if (existing) {
				existing.members.push(subcoLine.member);
			} else {
				subcos.push({
					id: subcoLine.id,
					name: subcoLine.name,
					company: subcoLine.company,
					backstoryId: subcoLine.backstoryId,
					members: [subcoLine.member]
				});
			}
		} else
			console.error(`%c sql result is not subco line`, `background:red;color:black`, {
				subcoLine
			});
	}
	return subcos;
}

export const subcoRepo = new SubcoRepo();

export type Subco = {
	id: number | null;
	name: string;
	company: number;
	backstoryId: string | null;
	members: number[];
};

export function isSubco(subco: unknown): subco is Subco {
	return (
		typeof subco === 'object' &&
		subco != null &&
		'name' in subco &&
		typeof subco.name === 'string' &&
		'company' in subco &&
		typeof subco.company === 'number' &&
		isNaN(subco.company) === false &&
		'backstoryId' in subco &&
		(typeof subco.backstoryId === 'string' || subco.backstoryId === null) &&
		'members' in subco &&
		Array.isArray(subco.members) &&
		subco.members.every((member) => typeof member === 'number' && isNaN(member) === false) &&
		'id' in subco &&
		(typeof subco.id === 'number' || subco.id === null)
	);
}

type SubcoLine = {
	id: number;
	name: string;
	company: number;
	backstoryId: string | null;
	member: number;
};

export function isSubcoLine(subcoLine: unknown): subcoLine is SubcoLine {
	return (
		typeof subcoLine === 'object' &&
		subcoLine != null &&
		'name' in subcoLine &&
		typeof subcoLine.name === 'string' &&
		'company' in subcoLine &&
		typeof subcoLine.company === 'number' &&
		isNaN(subcoLine.company) === false &&
		'backstoryId' in subcoLine &&
		(typeof subcoLine.backstoryId === 'string' || subcoLine.backstoryId === null) &&
		'member' in subcoLine &&
		typeof subcoLine.member === 'number' &&
		isNaN(subcoLine.member) === false &&
		'id' in subcoLine &&
		typeof subcoLine.id === 'number'
	);
}
