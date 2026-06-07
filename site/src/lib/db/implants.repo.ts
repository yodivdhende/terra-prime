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
          i.Cost as cost,
          i.Prerequisite as prerequisite
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
          i.Cost as cost,
          i.Prerequisite as prerequisite
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

	public async create({ name, description, prerequisite }: Omit<Implant, 'id'>) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
				INSERT INTO Implants (Name, Description, Prerequisite)
				Values (?,?,?)
        `,
				[name, description, prerequisite ?? null]
			);
			if ('serverStatus' in result && result.serverStatus !== 2) return null;
			if ('insertId' in result === false || result.insertId == null) return null;
			return result.insertId;
		} catch (err) {
			throw err;
		}
	}

	public async edit({ id, name, description, prerequisite }: Implant) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
				UPDATE Implants
				SET Name = ?,
				Description = ?,
				Prerequisite = ?
				WHERE Id = ?
        `,
				[name, description, prerequisite ?? null, id]
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
	prerequisite?: number | null;
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
		(typeof implant.id === 'number' || implant.id === null) &&
		(!('prerequisite' in implant) ||
			(implant as any).prerequisite === null ||
			typeof (implant as any).prerequisite === 'number')
	);
}
