import { mysqlconnFn } from './mysql';

class EmailTemplateRepo {
	public async getAll(): Promise<EmailTemplate[]> {
		try {
			const connection = await mysqlconnFn();
			const [result] = await connection.execute(`
				SELECT
					t.Id as id,
					t.\`Key\` as \`key\`,
					t.DocUrl as docUrl
				FROM Email_Templates t
			`);
			if (Array.isArray(result) === false) return [];
			const templates: EmailTemplate[] = [];
			for (let row of result) {
				if (isEmailTemplate(row)) templates.push(row);
				else
					console.error(`%c sql result is not an email template`, `background:red;color:black`, {
						row
					});
			}
			return templates;
		} catch (err) {
			throw err;
		}
	}

	public async getById(id: number): Promise<EmailTemplate | null> {
		try {
			const connection = await mysqlconnFn();
			const [result] = await connection.execute(
				`
				SELECT
					t.Id as id,
					t.\`Key\` as \`key\`,
					t.DocUrl as docUrl
				FROM Email_Templates t
				WHERE t.Id = ?
			`,
				[id]
			);
			if (Array.isArray(result) === false) return null;
			if (result.length === 0) return null;
			const [row] = result;
			if (isEmailTemplate(row) === false) return null;
			return row;
		} catch (err) {
			throw err;
		}
	}

	public async getByKey(key: string): Promise<EmailTemplate | null> {
		try {
			const connection = await mysqlconnFn();
			const [result] = await connection.execute(
				`
				SELECT
					t.Id as id,
					t.\`Key\` as \`key\`,
					t.DocUrl as docUrl
				FROM Email_Templates t
				WHERE t.\`Key\` = ?
			`,
				[key]
			);
			if (Array.isArray(result) === false) return null;
			if (result.length === 0) return null;
			const [row] = result;
			if (isEmailTemplate(row) === false) return null;
			return row;
		} catch (err) {
			throw err;
		}
	}

	public save(template: EmailTemplate) {
		if (template.id == null) return this.create(template);
		return this.edit(template);
	}

	public async create({ key, docUrl }: Omit<EmailTemplate, 'id'>) {
		try {
			const connection = await mysqlconnFn();
			const [result] = await connection.execute(
				`
				INSERT INTO Email_Templates (\`Key\`, DocUrl)
				VALUES (?, ?)
			`,
				[key, docUrl]
			);
			if ('serverStatus' in result && result.serverStatus !== 2) return null;
			if ('insertId' in result === false || result.insertId == null) return null;
			return result.insertId;
		} catch (err) {
			throw err;
		}
	}

	public async edit({ id, key, docUrl }: EmailTemplate) {
		try {
			const connection = await mysqlconnFn();
			const [result] = await connection.execute(
				`
				UPDATE Email_Templates
				SET \`Key\` = ?,
				    DocUrl = ?
				WHERE Id = ?
			`,
				[key, docUrl, id]
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
			await connection.execute(
				`
				DELETE FROM Email_Templates
				WHERE Id = ?
			`,
				[id]
			);
		} catch (err) {
			throw err;
		}
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
