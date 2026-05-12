import { mysqlconnFn } from './mysql';

class UserRepo {
	private userSelector = ' SELECT Id as id, Email as email, Name as name FROM Users';

	public async getByEmail({ email }: { email: string }): Promise<User> {
		const [results] = await (
			await mysqlconnFn()
		).execute(`${this.userSelector} WHERE email = ?  `, [email]);
		const [firstUser] = results as any;
		if (isUser(firstUser)) {
			return { id: firstUser.id, email: firstUser.email, name: firstUser.name };
		} else {
			throw new Error(`user not found with email: ${email}`);
		}
	}

	public async getById({ id }: { id: number }): Promise<User> {
		const connection =  await mysqlconnFn();
		const [results] = await connection.execute(`${this.userSelector} WHERE id = ?  `, [id]);
		const [firstUser] = results as any;
		if (isUser(firstUser)) {
			return { id: firstUser.id, email: firstUser.email, name: firstUser.name };
		} else {
			throw new Error(`user not found with id: ${id}`);
		}
	}

	public async getAll(): Promise<User[]> {
		const [results] = await (await mysqlconnFn()).execute(this.userSelector);
		return (results as any[]).filter(isUser);
	}

	public async update(user: User) {
		(await mysqlconnFn()).execute(
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
};

export function isUser(user: any): user is User {
	return (
		typeof user?.id === 'number' &&
		typeof user?.email === 'string' &&
		typeof user?.name === 'string' 
	);
}

export const userRepo = new UserRepo();
