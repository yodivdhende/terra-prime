import { mysqlconnFn } from './mysql';

class UserRepo {
	private userSelector =
		' SELECT Id as id, Email as email, Name as name, Verified as verified FROM Users';

	public async getByEmail({ email }: { email: string }): Promise<User> {
		const [results] = await (
			mysqlconnFn()
		).execute(`${this.userSelector} WHERE email = ?  `, [email]);
		const [firstUser] = results as unknown[];
		if (isUserRow(firstUser)) {
			return {
				id: firstUser.id,
				email: firstUser.email,
				name: firstUser.name,
				verified: Boolean(firstUser.verified)
			};
		} else {
			throw new Error(`user not found with email: ${email}`);
		}
	}

	public async getById({ id }: { id: number }): Promise<User> {
		const connection = mysqlconnFn();
		const [results] = await connection.execute(`${this.userSelector} WHERE id = ?  `, [id]);
		const [firstUser] = results as unknown[];
		if (isUserRow(firstUser)) {
			return {
				id: firstUser.id,
				email: firstUser.email,
				name: firstUser.name,
				verified: Boolean(firstUser.verified)
			};
		} else {
			throw new Error(`user not found with id: ${id}`);
		}
	}

	public async getAll(): Promise<User[]> {
		const [results] = await (mysqlconnFn()).execute(this.userSelector);
		return (results as unknown[])
			.filter(isUserRow)
			.map((row) => ({
				id: row.id,
				email: row.email,
				name: row.name,
				verified: Boolean(row.verified)
			}));
	}

	public async update(user: User) {
		(mysqlconnFn()).execute(
			`
					UPDATE Users
					SET Name = ?,
						Email = ?,
						Password = ''
					WHERE id = ?
					`,
			[user.name, user.email, user.id]
		);
	}
}

export type User = {
	id: number;
	email: string;
	name: string;
	verified: boolean;
};

function isUserRow(row: unknown): row is { id: number; email: string; name: string; verified: number | boolean } {
	if (typeof row !== 'object' || row === null) return false;
	const r = row as Record<string, unknown>;
	return (
		typeof r.id === 'number' &&
		typeof r.email === 'string' &&
		typeof r.name === 'string' &&
		(typeof r.verified === 'number' || typeof r.verified === 'boolean')
	);
}

export function isUser(user: unknown): user is User {
	if (typeof user !== 'object' || user === null) return false;
	const u = user as Record<string, unknown>;
	return (
		typeof u.id === 'number' &&
		typeof u.email === 'string' &&
		typeof u.name === 'string' &&
		typeof u.verified === 'boolean'
	);
}

export const userRepo = new UserRepo();
