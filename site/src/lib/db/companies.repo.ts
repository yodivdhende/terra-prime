import { eq } from 'drizzle-orm';
import { db } from './mysql';
import { companies } from './schema';

const companyColumns = {
	id: companies.id,
	name: companies.name,
	description: companies.description,
	link: companies.link
};

class CompanyRepo {
	public async getAll(): Promise<Company[]> {
		return db.select(companyColumns).from(companies);
	}

	public async getWithId(id: number): Promise<Company | null> {
		const [company] = await db.select(companyColumns).from(companies).where(eq(companies.id, id));
		return company ?? null;
	}

	public save(company: Company) {
		if (company.id == null) return this.create(company);
		return this.edit(company);
	}

	public async create({ name, description, link }: Omit<Company, 'id'>) {
		const [result] = await db.insert(companies).values({ name, description, link: link ?? null });
		return result.insertId ?? null;
	}

	public async edit({ id, name, description, link }: Company) {
		await db
			.update(companies)
			.set({ name, description, link: link ?? null })
			.where(eq(companies.id, id as number));
		return id;
	}

	public async delete({ id }: { id: number }) {
		await db.delete(companies).where(eq(companies.id, id));
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
