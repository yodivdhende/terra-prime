import { mysqlconnFn } from './mysql';

class CompanyRepo {
	public async getAll(): Promise<Company[]> {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(`
        SELECT
          c.Id as id,
          c.Name as name,
          c.Description as description,
          c.Link as link
        FROM Companies c
        `);
			if (Array.isArray(result) === false) return [];
			if (result.length === 0) return [];
			const companies: Company[] = [];
			for (let companyResult of result) {
				if (isCompany(companyResult)) companies.push(companyResult);
				else
					console.error(`%c sql result is not a company`, `background:red;color:black`, {
						companyResult
					});
			}
			return companies;
		} catch (err) {
			throw err;
		}
	}

	public async getWithId(id: number): Promise<Company | null> {
		try {
			const connection = await mysqlconnFn();
			const [result] = await connection.execute(
				`
        SELECT
          c.Id as id,
          c.Name as name,
          c.Description as description,
          c.Link as link
        FROM Companies c
        WHERE c.Id = ?
        `,
				[id]
			);
			if (Array.isArray(result) === false) return null;
			if (result.length === 0) return null;
			const [company] = result;
			if (isCompany(company) === false) return null;
			return company;
		} catch (err) {
			throw err;
		}
	}

	public save(company: Company) {
		if (company.id == null) return this.create(company);
		return this.edit(company);
	}

	public async create({ name, description, link }: Omit<Company, 'id'>) {
		try {
			const connection = await mysqlconnFn();
			const [result] = await connection.execute(
				`INSERT INTO Companies (Name, Description, Link) VALUES (?, ?, ?)`,
				[name, description, link ?? null]
			);
			if ('serverStatus' in result && result.serverStatus !== 2) return null;
			if ('insertId' in result === false || result.insertId == null) return null;
			return result.insertId;
		} catch (err) {
			throw err;
		}
	}

	public async edit({ id, name, description, link }: Company) {
		try {
			const connection = await mysqlconnFn();
			const [result] = await connection.execute(
				`UPDATE Companies SET Name = ?, Description = ?, Link = ? WHERE Id = ?`,
				[name, description, link ?? null, id]
			);
			if ('serverStatus' in result && result.serverStatus !== 2) return null;
			return id;
		} catch (err) {
			throw err;
		}
	}

	public async delete({ id }: { id: number }) {
		try {
			const connection = await mysqlconnFn();
			await connection.execute(`DELETE FROM Companies WHERE Id = ?`, [id]);
		} catch (err) {
			throw err;
		}
	}
}

export const companyRepo = new CompanyRepo();

export type Company = {
	id: number | null;
	name: string;
	description: string;
	link: string | null;
};

export function isCompany(obj: unknown): obj is Company {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'id' in obj &&
		(typeof obj.id === 'number' || obj.id === null) &&
		'name' in obj &&
		typeof obj.name === 'string' &&
		'description' in obj &&
		typeof obj.description === 'string' &&
		'link' in obj &&
		(typeof obj.link === 'string' || obj.link === null)
	);
}
