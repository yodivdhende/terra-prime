import { v4 as uuidv4 } from 'uuid';
import { RequestError } from '$lib/types/errors';
import { mysqlconnFn } from './mysql';

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
				INSERT INTO Subco_Invites (Token, Subco, Email, ExpiresAt)
				VALUES (?, ?, ?, NOW() + INTERVAL 7 DAY)
			`,
			[token, subcoId, email]
		);
		return token;
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
		const row = rows[0] as { subcoId: number; email: string; expiresAt: Date };
		if (new Date(row.expiresAt).getTime() < Date.now())
			throw new RequestError(400, 'invalid or expired invite token');

		await connection.execute(`DELETE FROM Subco_Invites WHERE Token = ?`, [token]);
		return { subcoId: row.subcoId, email: row.email };
	}

	private async removeExpired(): Promise<void> {
		const connection = mysqlconnFn();
		await connection.execute(`DELETE FROM Subco_Invites WHERE ExpiresAt < NOW()`);
	}
}

export const subcoInviteRepo = new SubcoInviteRepo();
