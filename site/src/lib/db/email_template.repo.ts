import { eq } from 'drizzle-orm';
import { db } from './mysql';
import { emailTemplates } from './schema';

const templateColumns = {
	id: emailTemplates.id,
	key: emailTemplates.key,
	docUrl: emailTemplates.docUrl
};

class EmailTemplateRepo {
	public async getAll(): Promise<EmailTemplate[]> {
		return db.select(templateColumns).from(emailTemplates);
	}

	public async getById(id: number): Promise<EmailTemplate | null> {
		const [row] = await db
			.select(templateColumns)
			.from(emailTemplates)
			.where(eq(emailTemplates.id, id));
		return row ?? null;
	}

	public async getByKey(key: string): Promise<EmailTemplate | null> {
		const [row] = await db
			.select(templateColumns)
			.from(emailTemplates)
			.where(eq(emailTemplates.key, key));
		return row ?? null;
	}

	public save(template: EmailTemplate) {
		if (template.id == null) return this.create(template);
		return this.edit(template);
	}

	public async create({ key, docUrl }: Omit<EmailTemplate, 'id'>) {
		const [result] = await db.insert(emailTemplates).values({ key, docUrl });
		return result.insertId ?? null;
	}

	public async edit({ id, key, docUrl }: EmailTemplate) {
		await db
			.update(emailTemplates)
			.set({ key, docUrl })
			.where(eq(emailTemplates.id, id as number));
		return id;
	}

	public async delete({ id }: { id: number }) {
		await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
	}
}

export const emailTemplateRepo = new EmailTemplateRepo();

export type EmailTemplate = {
	id: number | null;
	key: string;
	docUrl: string;
};

export function isEmailTemplate(obj: unknown): obj is EmailTemplate {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'id' in obj &&
		(typeof obj.id === 'number' || obj.id === null) &&
		'key' in obj &&
		typeof obj.key === 'string' &&
		'docUrl' in obj &&
		typeof obj.docUrl === 'string'
	);
}

export function extractDocId(docUrl: string): string | null {
	const match = docUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
	return match?.[1] ?? null;
}
