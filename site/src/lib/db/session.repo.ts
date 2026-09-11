import { isPublicUserRole, type UserRole } from '$lib/types/roles';
import { v4 as uuidv4 } from 'uuid';
import { and, eq, inArray, isNotNull, lt, sql } from 'drizzle-orm';
import { db } from './mysql';
import { sessionRoles, sessions } from './schema';

class SessionRepo {
	public async create({ userId, roles, end, description }: NewSession): Promise<string> {
		await this.removeExpiredSessions();
		if (userId != null) await this.deleteByUserId(userId);
		const token = await this.addSession({ userId, end, description });
		await this.addSessionRoles({ roles, token });
		return token;
	}

	private async addSession({
		userId,
		end,
		description
	}: {
		userId: number | null;
		end: Date | null;
		description: string | null;
	}): Promise<string> {
		const token = uuidv4();
		await db.insert(sessions).values({
			token,
			userId,
			start: sql`NOW()`,
			end,
			description
		});
		return token;
	}

	private async addSessionRoles({
		roles,
		token
	}: {
		roles: UserRole[];
		token: string;
	}): Promise<void> {
		if (roles.length === 0) return;
		await db.insert(sessionRoles).values(roles.map((role) => ({ token, role })));
	}

	private async deleteByUserId(userId: number) {
		const tokens = db
			.select({ token: sessions.token })
			.from(sessions)
			.where(eq(sessions.userId, userId));
		await db.delete(sessionRoles).where(inArray(sessionRoles.token, tokens));
		await db.delete(sessions).where(eq(sessions.userId, userId));
	}

	public async delete(token: string) {
		await this.removeExpiredSessions();
		await db.delete(sessionRoles).where(eq(sessionRoles.token, token));
		await db.delete(sessions).where(eq(sessions.token, token));
	}

	public async getCredentials(
		token: string
	): Promise<{ userId: number | null; roles: UserRole[] } | null> {
		await this.removeExpiredSessions();
		const rows = await db
			.select({ userId: sessions.userId, role: sessionRoles.role })
			.from(sessionRoles)
			.innerJoin(sessions, eq(sessionRoles.token, sessions.token))
			.where(eq(sessions.token, token));
		if (rows.length === 0) return null;
		return {
			userId: rows[0].userId,
			roles: rows.map((row) => row.role as UserRole)
		};
	}

	private async removeExpiredSessions() {
		const expired = db
			.select({ token: sessions.token })
			.from(sessions)
			.where(and(isNotNull(sessions.end), lt(sessions.end, sql`NOW()`)));
		await db.delete(sessionRoles).where(inArray(sessionRoles.token, expired));
		await db.delete(sessions).where(and(isNotNull(sessions.end), lt(sessions.end, sql`NOW()`)));
	}

	public async getAll(): Promise<Session[]> {
		const rows = await db
			.select({
				token: sessions.token,
				userId: sessions.userId,
				start: sessions.start,
				end: sessions.end,
				description: sessions.description,
				role: sessionRoles.role
			})
			.from(sessions)
			.innerJoin(sessionRoles, eq(sessions.token, sessionRoles.token));

		const result: Session[] = [];
		for (const row of rows) {
			let session = result.find((s) => s.token === row.token);
			if (session === undefined) {
				session = {
					token: row.token,
					userId: row.userId,
					start: row.start,
					end: row.end,
					description: row.description ?? '',
					roles: []
				};
				result.push(session);
			}
			const role = row.role as UserRole;
			if (session.roles.includes(role) === false) session.roles.push(role);
		}
		return result;
	}
}

export const sessionRepo = new SessionRepo();

export type NewSession = {
	userId: number | null;
	end: Date | null;
	description: string;
	roles: UserRole[];
};

export function isNewSession(session: unknown): session is NewSession {
	if (typeof session !== 'object' || session === null) return false;
	return (
		'userId' in session &&
		(typeof session.userId === 'number' || session.userId === null) &&
		'end' in session &&
		(session.end instanceof Date || session.end === null) &&
		'description' in session &&
		typeof session.description === 'string' &&
		'roles' in session &&
		Array.isArray(session.roles) &&
		session.roles.every((role: unknown) => isPublicUserRole(role))
	);
}

export type Session = NewSession & {
	token: string;
	start: Date;
};

export function isSession(session: unknown): session is Session {
	if (typeof session !== 'object' || session === null) return false;
	return (
		isNewSession(session) &&
		'token' in session &&
		typeof session.token === 'string' &&
		'start' in session &&
		session.start instanceof Date
	);
}
