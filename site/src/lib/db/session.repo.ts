import { isPublicUserRole, type UserRole } from '$lib/types/roles';
import { v4 as uuidv4 } from 'uuid';
import { mysqlconnFn } from './mysql';
import { type Connection as MySqlConnection } from 'mysql2/promise';

class SessionRepo {
	public async create({
		userId,
		roles,
		end,
		description
	}: NewSession): Promise<string> {
		await this.removeExpiredSessions();
		if (userId != null) await this.deleteByUserId(userId);
		const connection = mysqlconnFn();
		const token = await this.addSessions(connection, { userId, end: end ?? undefined, description: description ?? undefined });
		await this.addSessionRoles(connection, { roles, token });
		return token;
	}

	private async addSessions(
		connection: MySqlConnection,
		{ userId, end, description }: { userId: number | null; end?: Date; description?: string }
	): Promise<string> {
		const sessionToken = uuidv4();
		await connection.execute(
			`
            INSERT INTO \`Sessions\`(Token, UserId,Start, End, Description)
            VALUES (?, ?,NOW(), ?, ?)
            `,
			[sessionToken, userId, this.convertDateToDateTimeString(end), description ?? null]
		);
		return sessionToken;
	}

	private convertDateToDateTimeString(date?: Date) {
		return date?.toJSON().slice(0, 19).replace('T', ' ') ?? null;
	}

	private async addSessionRoles(
		connection: MySqlConnection,
		{ roles, token }: { roles: UserRole[]; token: string }
	): Promise<void> {
		const queryValues: string[] = roles.map(() => '(?, ?)');
		const values = roles.flatMap((role) => [token, role]);
		await connection.execute(
			`
            INSERT INTO \`Session_Roles\` (Token, Role)
            VALUES ${queryValues.join(',')}
            `,
			values
		);
	}

	private async deleteByUserId(userId: number) {
		const connection = mysqlconnFn();
		await connection.execute(
			`DELETE FROM \`Session_Roles\` WHERE Token IN (SELECT Token FROM \`Sessions\` WHERE UserId = ?)`,
			[userId]
		);
		await connection.execute(`DELETE FROM \`Sessions\` WHERE UserId = ?`, [userId]);
	}

	public async delete(token: string) {
		await this.removeExpiredSessions();
		const connection = mysqlconnFn();
		await this.deleteSessionRoles(connection, token);
		await this.deleteSessions(connection, token);
	}

	private async deleteSessions(connection: MySqlConnection, token: string) {
		await connection.execute(
			`
                DELETE FROM \`Sessions\` 
                WHERE Token = ?
                `,
			[token]
		);
	}

	private async deleteSessionRoles(connection: MySqlConnection, token: string) {
		await connection.execute(
			`
                DELETE FROM \`Session_Roles\` 
                WHERE Token = ?
                `,
			[token]
		);
	}

	public async getCredentials(token: string): Promise<{ userId: number | null; roles: UserRole[] } | null> {
			await this.removeExpiredSessions();
			const connection = mysqlconnFn();
			const [dbResult] = await connection.execute(`
                SELECT
					s.UserId as userId,
					sr.Role as role
				FROM \`Session_Roles\` sr
				JOIN \`Sessions\` s
					ON sr.Token = s.Token
                WHERE s.Token = ?
            `,[token]);
			if (Array.isArray(dbResult) === false) return null;
			if (dbResult.length === 0) return null;
			let userRoleResult: { userId: number; roles: UserRole[] } | undefined;
			for (let { userId, role } of dbResult as any[]) {
				if(userRoleResult === undefined) userRoleResult = {userId, roles: []};
				userRoleResult.roles.push(role);
			}
			return userRoleResult ?? null;
	}

	private async removeExpiredSessions() {
		const connection = mysqlconnFn();
		await connection.execute(`
                DELETE FROM \`Session_Roles\` 
                WHERE Token in (
                    SELECT Token
                    FROM \`Sessions\` s  
                    WHERE  s.End IS NOT NULL
                    AND s.End < NOW()
                )
            `);
		await connection.execute(`
                DELETE FROM  \`Sessions\`
                WHERE End IS NOT NULL
                AND End < NOW()
				`);
	}

	public async getAll() {
		const connection = mysqlconnFn();
		const [sessionRoles] = await connection.execute(`
				SELECT
					s.Token as token,
					s.Start as start,
					s.End as end,
					s.Description as description,
					sr.Role as role
				FROM \`Sessions\` s
				join \`Session_Roles\` sr
					on s.Token = sr.Token 
				`);
		const sessions: Session[] = [];
		for (let sessionRole of sessionRoles as any[]) {
			let existingSessions = sessions.find(
				(connection) => connection.token === sessionRole.token
			);
			if (existingSessions === undefined) {
				existingSessions = {
					token: sessionRole.token,
					userId: sessionRole.userId,
					start: sessionRole.start,
					end: sessionRole.end,
					description: sessionRole.description,
					roles: []
				};
				sessions.push(existingSessions);
			}
			if (existingSessions.roles.includes(sessionRole.role) === false) {
				existingSessions.roles.push(sessionRole.role);
			}
		}
		return sessions;
	}
}

export const sessionRepo = new SessionRepo();
export type NewSession = {
	userId: number | null;
	end: Date | null;
	description: string;
	roles: UserRole[];
}
export function isNewSession(session: any): session is NewSession {
	return 'userId' in session
	&& (typeof session.userId === 'number' || session.userId === null) 
	&& 'end' in session
	&& (session.end instanceof Date || session.end === null) 
	&& 'description' in session
	&& typeof  session.description === 'string' 
	&& 'roles' in session
	&& Array.isArray(session.roles)
	&& session.roles.every((role: any) => isPublicUserRole(role))
}

export type Session = NewSession & {
	token: string;
	start: Date;
};

export function isSession(session: any): session is Session {
	return isNewSession(session)
	&& 'token' in session
	&& typeof session.token === 'string'
	&& 'start' in session
	&& session.start instanceof Date
}


