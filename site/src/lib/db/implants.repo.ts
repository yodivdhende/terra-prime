import { mysqlconnFn } from './mysql';

class ImplantRepo {
	public async getAll(): Promise<Implant[]> {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(`
        SELECT
          i.Id as id,
          i.Name as name,
          i.Description as description,
          i.Cost as cost
        FROM Implants i
        `);
			if (Array.isArray(result) === false) return [];
			if (result.length === 0) return [];
			const implants: Implant[] = [];
			for (let implantResult of result) {
				if (isImplants(implantResult)) implants.push(implantResult);
				else
					console.error(`%c sql result is not a item`, `background:red;color:black`, {
						implantResult
					});
			}
			return implants;
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
          i.Id as id,
          i.Name as name,
          i.Description as description,
          i.Cost as cost
        FROM Implants i
		WHERE i.Id = ?
        `,
				[id]
			);
			if (Array.isArray(result) === false) return null;
			if (result.length === 0) return null;
			const [implant] = result;
			if (isImplants(implant) === false) return null;
			return implant;
		} catch (err) {
			throw err;
		}
	}

	public async getWithIds(ids: number) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
        SELECT
          i.Id as id,
          i.Name as name,
          i.Description as description,
          i.Cost as cost
        FROM Implants i
				WHERE i.Id in (:ids)
        `,
				{ ids }
			);
			if (Array.isArray(result) === false) return null;
			if (result.length === 0) return null;
			const [implant] = result;
			if (isImplants(implant) === false) return null;
			return implant;
		} catch (err) {
			throw err;
		}
	}

	public save(implant: Implant) {
		if (implant.id == null) return this.create(implant);
		return this.edit(implant);
	}

	public async saveBulk(items: Implant[]) {
		const toCreate = items.filter((i) => i.id == null);
		const toUpdate = items.filter((i) => i.id != null);
		const conn = await mysqlconnFn().getConnection();
		try {
			await conn.beginTransaction();
			if (toCreate.length > 0) {
				const placeholders = toCreate.map(() => '(?,?,?)').join(',');
				const values = toCreate.flatMap((i) => [i.name, i.description, i.cost ?? 0]);
				await conn.execute(
					`INSERT INTO Implants (Name, Description, Cost) VALUES ${placeholders}`,
					values
				);
			}
			if (toUpdate.length > 0) {
				const placeholders = toUpdate.map(() => '(?,?,?,?)').join(',');
				const values = toUpdate.flatMap((i) => [i.id, i.name, i.description, i.cost ?? 0]);
				await conn.execute(
					`INSERT INTO Implants (Id, Name, Description, Cost) VALUES ${placeholders}
					 ON DUPLICATE KEY UPDATE Name=VALUES(Name), Description=VALUES(Description), Cost=VALUES(Cost)`,
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

	public async create({ name, description, cost }: Omit<Implant, 'id'>) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
				INSERT INTO Implants (Name, Description, Cost)
				Values (?,?,?)
        `,
				[name, description, cost ?? 0]
			);
			if ('serverStatus' in result && result.serverStatus !== 2) return null;
			if ('insertId' in result === false || result.insertId == null) return null;
			return result.insertId;
		} catch (err) {
			throw err;
		}
	}

	public async edit({ id, name, description, cost }: Implant) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
				UPDATE Implants
				SET Name = ?,
				Description = ?,
				Cost = ?
				WHERE Id = ?
        `,
				[name, description, cost ?? 0, id]
			);
			if ('serverStatus' in result && result.serverStatus !== 2) return null;
			return id;
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
                FROM Implants
                WHERE Id = ?
            `,
				[id]
			);
		} catch (err) {
			throw err;
		}
	}
}
export const implantRepo = new ImplantRepo();

export type Implant = {
	id: number | null;
	name: string;
	description: string;
	cost?: number;
};

export function isImplants(implant: unknown): implant is Implant {
	return (
		typeof implant === 'object' &&
		implant !== null &&
		'name' in implant &&
		typeof implant.name === 'string' &&
		'description' in implant &&
		typeof implant.description === 'string' &&
		'id' in implant &&
		(typeof implant.id === 'number' || implant.id === null)
	);
}
