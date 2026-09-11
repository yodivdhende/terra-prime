import { eq } from 'drizzle-orm';
import { db } from './mysql';
import { users } from './schema';

const userColumns = {
	id: users.id,
	email: users.email,
	name: users.name,
	verified: users.verified
};

/** `Email` and `Name` are nullable in the schema; the domain type is not, so empty-string them. */
function toUser(row: {
	id: number;
	email: string | null;
	name: string | null;
	verified: boolean;
}): User {
	return { id: row.id, email: row.email ?? '', name: row.name ?? '', verified: row.verified };
}

class UserRepo {
	public async getByEmail({ email }: { email: string }): Promise<User> {
		const [row] = await db.select(userColumns).from(users).where(eq(users.email, email));
		if (row == null) throw new Error(`user not found with email: ${email}`);
		return toUser(row);
	}

	public async getById({ id }: { id: number }): Promise<User> {
		const [row] = await db.select(userColumns).from(users).where(eq(users.id, id));
		if (row == null) throw new Error(`user not found with id: ${id}`);
		return toUser(row);
	}

	public async getAll(): Promise<User[]> {
		const rows = await db.select(userColumns).from(users);
		return rows.map(toUser);
	}

	public async update(user: User) {
		// Blanking `Password` is pre-existing behaviour, carried over unchanged by the Drizzle port.
		await db
			.update(users)
			.set({ name: user.name, email: user.email, password: '' })
			.where(eq(users.id, user.id));
	}
}

export type User = {
	id: number;
	email: string;
	name: string;
	verified: boolean;
};

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
