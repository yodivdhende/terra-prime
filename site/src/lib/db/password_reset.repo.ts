import { v4 as uuidv4 } from 'uuid';
import { eq, lt, sql } from 'drizzle-orm';
import { RequestError } from '$lib/types/errors';
import { db } from './mysql';
import { passwordResetTokens } from './schema';

class PasswordResetRepo {
	public async createToken(userId: number): Promise<string> {
		await this.removeExpired();
		await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
		const token = uuidv4();
		await db.insert(passwordResetTokens).values({
			token,
			userId,
			expiresAt: sql`NOW() + INTERVAL 24 HOUR`
		});
		return token;
	}

	public async consumeToken(token: string): Promise<number> {
		const [row] = await db
			.select({ userId: passwordResetTokens.userId, expiresAt: passwordResetTokens.expiresAt })
			.from(passwordResetTokens)
			.where(eq(passwordResetTokens.token, token));
		if (row == null || row.expiresAt.getTime() < Date.now())
			throw new RequestError(400, 'invalid or expired reset token');

		await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
		return row.userId;
	}

	private async removeExpired(): Promise<void> {
		await db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, sql`NOW()`));
	}
}

export const passwordResetRepo = new PasswordResetRepo();
