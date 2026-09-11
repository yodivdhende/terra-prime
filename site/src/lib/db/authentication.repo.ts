import { eq, isNotNull } from 'drizzle-orm';
import { UserRole } from '$lib/types/roles';
import { db } from './mysql';
import { admins, users } from './schema';
import bcrypt from 'bcrypt';

class AuthenticationRepo {
	public async register(newUser: NewUser) {
		const passwordHash = await bcrypt.hash(newUser.password, 13);
		const [result] = await db.insert(users).values({
			name: newUser.name,
			email: newUser.email,
			password: passwordHash
		});
		return result.insertId ?? null;
	}

	public async updatePassword(userId: number, newPassword: string) {
		const passwordHash = await bcrypt.hash(newPassword, 13);
		await db.update(users).set({ password: passwordHash }).where(eq(users.id, userId));
	}

	public async getCredentials(authUser: AuthUser) {
		const [row] = await db
			.select({
				userId: users.id,
				name: users.name,
				password: users.password,
				isAdmin: isNotNull(admins.userId)
			})
			.from(users)
			.leftJoin(admins, eq(admins.userId, users.id))
			.where(eq(users.email, authUser.email));
		if (row == null || row.password == null) return null;
		if ((await bcrypt.compare(authUser.password, row.password)) === false) return null;

		const credential: { userId: number; name: string; roles: UserRole[] } = {
			userId: row.userId,
			name: row.name ?? '',
			roles: [UserRole.user]
		};
		if (row.isAdmin) credential.roles.push(UserRole.admin);
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
