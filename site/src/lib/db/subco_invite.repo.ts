import { v4 as uuidv4 } from 'uuid';
import { RequestError } from '$lib/types/errors';
import { mysqlconnFn } from './mysql';

export type InviteStatus = 'invited' | 'accepted' | 'error';

export interface InviteRecord {
	token: string;
	email: string;
	status: InviteStatus;
	createdAt: Date;
}

class SubcoInviteRepo {
	public async createToken({
		subcoId,
		email
	}: {
		subcoId: number;
		email: string;
	}): Promise<string> {
		await this.removeExpired();
		const connection = mysqlconnFn();
		const token = uuidv4();
		await connection.execute(
			`
				INSERT INTO Subco_Invites (Token, Subco, Email, ExpiresAt, Status)
				VALUES (?, ?, ?, NOW() + INTERVAL 7 DAY, 'invited')
			`,
			[token, subcoId, email]
		);
		return token;
	}

	public async insertDirect({
		subcoId,
		email
	}: {
		subcoId: number;
		email: string;
	}): Promise<void> {
		const connection = mysqlconnFn();
		await connection.execute(
			`
				INSERT INTO Subco_Invites (Token, Subco, Email, ExpiresAt, Status)
				VALUES (UUID(), ?, ?, NULL, 'accepted')
			`,
			[subcoId, email]
		);
	}

	public async consumeToken(token: string): Promise<{ subcoId: number; email: string }> {
		const connection = mysqlconnFn();
		const [rows] = await connection.execute(
			`
				SELECT Subco as subcoId, Email as email, ExpiresAt as expiresAt
				FROM Subco_Invites
				WHERE Token = ?
			`,
			[token]
		);
		if (Array.isArray(rows) === false || rows.length === 0)
			throw new RequestError(400, 'invalid or expired invite token');
		const row = rows[0] as { subcoId: number; email: string; expiresAt: Date | null };
		if (row.expiresAt != null && new Date(row.expiresAt).getTime() < Date.now())
			throw new RequestError(400, 'invalid or expired invite token');

		await connection.execute(
			`UPDATE Subco_Invites SET Status = 'accepted' WHERE Token = ?`,
			[token]
		);
		return { subcoId: row.subcoId, email: row.email };
	}

	public async setStatus({
		token,
		status
	}: {
		token: string;
		status: InviteStatus;
	}): Promise<void> {
		const connection = mysqlconnFn();
		await connection.execute(`UPDATE Subco_Invites SET Status = ? WHERE Token = ?`, [
			status,
			token
		]);
	}

	public async getBySubco({ subcoId }: { subcoId: number }): Promise<InviteRecord[]> {
		const connection = mysqlconnFn();
		const [rows] = await connection.execute(
			`
				SELECT Token as token, Email as email, Status as status, CreatedAt as createdAt
				FROM Subco_Invites
				WHERE Subco = ?
				ORDER BY CreatedAt DESC
			`,
			[subcoId]
		);
		return (rows as InviteRecord[]).map((r) => ({ ...r, createdAt: new Date(r.createdAt) }));
	}

	public async getByToken({ token }: { token: string }): Promise<InviteRecord & { subcoId: number }> {
		const connection = mysqlconnFn();
		const [rows] = await connection.execute(
			`
				SELECT Token as token, Subco as subcoId, Email as email, Status as status, CreatedAt as createdAt
				FROM Subco_Invites
				WHERE Token = ?
			`,
			[token]
		);
		if (Array.isArray(rows) === false || rows.length === 0)
			throw new RequestError(404, 'invite not found');
		const row = rows[0] as InviteRecord & { subcoId: number; createdAt: Date };
		return { ...row, createdAt: new Date(row.createdAt) };
	}

	public async extendAndReset({ token }: { token: string }): Promise<void> {
		const connection = mysqlconnFn();
		await connection.execute(
			`UPDATE Subco_Invites SET Status = 'invited', ExpiresAt = NOW() + INTERVAL 7 DAY WHERE Token = ?`,
			[token]
		);
	}

	public async deleteByToken({ token }: { token: string }): Promise<void> {
		const connection = mysqlconnFn();
		await connection.execute(`DELETE FROM Subco_Invites WHERE Token = ?`, [token]);
	}

	private async removeExpired(): Promise<void> {
		const connection = mysqlconnFn();
		await connection.execute(
			`DELETE FROM Subco_Invites WHERE Status = 'invited' AND ExpiresAt < NOW()`
		);
	}
}

export const subcoInviteRepo = new SubcoInviteRepo();
