import { mysqlconnFn } from './mysql';

class SubcoRepo {
	public async getAll(): Promise<Subco[]> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(`
              SELECT
                  s.Id as id,
                  s.Name as name,
                  sm.Member as member
              FROM Subco s
              JOIN Subco_Members sm
                  on sm.Subco = s.Id
          `);
		if (Array.isArray(result) === false) return [];
		if (result.length === 0) return [];
		const subcos: Subco[] = [];
		for (const subcoResult of result) {
			if (isSubcoLine(subcoResult)) {
				const existingSubco = subcos.find((subco) => subco.id === subcoResult.id);
				if (existingSubco) {
					existingSubco.members.push(subcoResult.member);
				} else {
					subcos.push({
						id: subcoResult.id,
						name: subcoResult.name,
						members: [subcoResult.member]
					});
				}
			} else
				console.error(`%c sql result is not subco line`, `background:red;color:black`, {
					subcoResult
				});
		}
		return subcos;
	}

	public save({ id, name, members }: Subco) {
		if (id == null) return this.create({ name, members });
		return this.edit({ id, name, members });
	}

	public async create({ name, members }: Omit<Subco, 'id'>) {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
              INSERT INTO Subco (Name)
              VALUES (?)
          `,
			[name]
		);
		if ('serverStatus' in result && result.serverStatus !== 2) return null;
		if ('insertId' in result === false || result.insertId == null) return null;
		const subcoId = result.insertId;
		await this.replaceMembers({ subcoId, members });
		return subcoId;
	}

	public async edit({ id, name, members }: Subco) {
		if (id == null) return null;
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
              UPDATE Subco
              SET Name = ?
              WHERE Id = ?
          `,
			[name, id]
		);
		if ('serverStatus' in result && result.serverStatus !== 2) return null;
		await this.replaceMembers({ subcoId: id, members });
		return id;
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
		if (Array.isArray(result) === false) return;
		if (result.length === 0) return;
		let subcoResult: Subco | undefined;
		for (const subcoLine of result) {
			if (isSubcoLine(subcoLine)) {
				if (subcoResult != null) {
					subcoResult.members.push(subcoLine.member);
				} else {
					subcoResult = {
						id: subcoLine.id,
						name: subcoLine.name,
						members: [subcoLine.member]
					};
				}
			} else
				console.error(`%c sql result is not subco line`, `background:red;color:black`, {
					subcoLine
				});
		}
		return subcoResult;
	}
}

export const subcoRepo = new SubcoRepo();

export type Subco = {
	id: number | null;
	name: string;
	members: number[];
};

export function isSubco(subco: unknown): subco is Subco {
	return (
		typeof subco === 'object' &&
		subco != null &&
		'name' in subco &&
		typeof subco.name === 'string' &&
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
	member: number;
};

export function isSubcoLine(subcoLine: unknown): subcoLine is SubcoLine {
	return (
		typeof subcoLine === 'object' &&
		subcoLine != null &&
		'name' in subcoLine &&
		typeof subcoLine.name === 'string' &&
		'member' in subcoLine &&
		typeof subcoLine.member === 'number' &&
		isNaN(subcoLine.member) === false &&
		'id' in subcoLine &&
		typeof subcoLine.id === 'number'
	);
}
