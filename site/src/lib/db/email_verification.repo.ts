import { v4 as uuidv4 } from 'uuid';
import { RequestError } from '$lib/types/errors';
import { mysqlconnFn } from './mysql';

class EmailVerificationRepo {
	public async createToken(userId: number): Promise<string> {
		await this.removeExpired();
		const connection = mysqlconnFn();
		await connection.execute(`DELETE FROM Email_Verification_Tokens WHERE UserId = ?`, [userId]);
		const token = uuidv4();
		await connection.execute(
			`
			INSERT INTO Email_Verification_Tokens (Token, UserId, ExpiresAt)
			VALUES (?, ?, NOW() + INTERVAL 24 HOUR)
		`,
			[token, userId]
		);
		return token;
	}

	public async consumeToken(token: string): Promise<number> {
		const connection = mysqlconnFn();
		const [rows] = await connection.execute(
			`
			SELECT UserId as userId, ExpiresAt as expiresAt
			FROM Email_Verification_Tokens
			WHERE Token = ?
		`,
			[token]
		);
		if (Array.isArray(rows) === false || rows.length === 0)
			throw new RequestError(400, 'invalid or expired verification token');
		const row = rows[0] as { userId: number; expiresAt: Date };
		if (new Date(row.expiresAt).getTime() < Date.now())
			throw new RequestError(400, 'invalid or expired verification token');

		await connection.execute(`UPDATE Users SET Verified = 1 WHERE Id = ?`, [row.userId]);
		await connection.execute(`DELETE FROM Email_Verification_Tokens WHERE Token = ?`, [token]);
		return row.userId;
	}

	private async removeExpired(): Promise<void> {
		const connection = mysqlconnFn();
		await connection.execute(`DELETE FROM Email_Verification_Tokens WHERE ExpiresAt < NOW()`);
	}
}

export const emailVerificationRepo = new EmailVerificationRepo();
