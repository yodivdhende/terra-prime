import { mysqlconnFn } from './mysql';

class UserRepo {
	private userSelector =
		' SELECT Id as id, Email as email, Name as name, Verified as verified FROM Users';

	public async getByEmail({ email }: { email: string }): Promise<User> {
		const [results] = await (
			mysqlconnFn()
		).execute(`${this.userSelector} WHERE email = ?  `, [email]);
		const [firstUser] = results as any;
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
		const [firstUser] = results as any;
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
		return (results as any[])
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
	id: string;
	email: string;
	name: string;
	verified: boolean;
};

function isUserRow(row: any): row is { id: number; email: string; name: string; verified: number | boolean } {
	return (
		typeof row?.id === 'number' &&
		typeof row?.email === 'string' &&
		typeof row?.name === 'string' &&
		(typeof row?.verified === 'number' || typeof row?.verified === 'boolean')
	);
}

export function isUser(user: any): user is User {
	return (
		typeof user?.id === 'number' &&
		typeof user?.email === 'string' &&
		typeof user?.name === 'string' &&
		typeof user?.verified === 'boolean'
	);
}

export const userRepo = new UserRepo();
