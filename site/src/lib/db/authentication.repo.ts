import { UserRole } from '$lib/types/roles';
import { mysqlconnFn } from './mysql';
import bcrypt from 'bcrypt';

class AuthenticationRepo {
	public async register(newUser: NewUser) {
		const connection = mysqlconnFn();
		const passwordHash = await bcrypt.hash(newUser.password, 13);
		const [result] = await connection.execute(
			`
          INSERT Users (Name, Email, Password)
          VALUES (?, ?, ?)
              `,
			[newUser.name, newUser.email, passwordHash]
		);
		if ('serverStatus' in result && result.serverStatus !== 2) return null;
		if ('insertId' in result === false || result.insertId == null) return null;
		return result.insertId;
	}

	public async updatePassword(userId: number, newPassword: string) {
		const connection = mysqlconnFn();
		const passwordHash = await bcrypt.hash(newPassword, 13);
		await connection.execute(`UPDATE Users SET Password = ? WHERE Id = ?`, [passwordHash, userId]);
	}

	public async getCredentials(authUser: AuthUser) {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
		SELECT
			u.Id as userId,
              u.Name as name,
              u.Password as password,
              CASE
                  WHEN a.UserId IS NULL THEN FALSE
				ELSE TRUE
			END AS isAdmin
          FROM Users u
          LEFT JOIN Admins a
              ON a.userId = u.id
          WHERE email = ?
      `,
			[authUser.email]
		);
		const row = (result as { userId: number; name: string; password: string; isAdmin: boolean }[])[0];
		if (row == null) return null;
		const { userId, name, password, isAdmin } = row;
		if ((await bcrypt.compare(authUser.password, password)) === false) return null;
		const credential: { userId: number; name: string; roles: UserRole[] } = {
			userId,
			name,
			roles: [UserRole.user]
		};
		if (isAdmin) credential.roles.push(UserRole.admin);
		return credential;
	}
}

export const authenticationRepo = new AuthenticationRepo();

type NewUser = {
	name: string;
	email: string;
	password: string;
};

type AuthUser = {
	email: string;
	password: string;
};
