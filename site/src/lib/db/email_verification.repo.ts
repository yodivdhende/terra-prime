import { v4 as uuidv4 } from 'uuid';
import { eq, lt, sql } from 'drizzle-orm';
import { RequestError } from '$lib/types/errors';
import { db } from './mysql';
import { emailVerificationTokens, users } from './schema';

class EmailVerificationRepo {
	public async createToken(userId: number): Promise<string> {
		await this.removeExpired();
		await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
		const token = uuidv4();
		await db.insert(emailVerificationTokens).values({
			token,
			userId,
			expiresAt: sql`NOW() + INTERVAL 24 HOUR`
		});
		return token;
	}

	public async consumeToken(token: string): Promise<number> {
		const [row] = await db
			.select({
				userId: emailVerificationTokens.userId,
				expiresAt: emailVerificationTokens.expiresAt
			})
			.from(emailVerificationTokens)
			.where(eq(emailVerificationTokens.token, token));
		if (row == null || row.expiresAt.getTime() < Date.now())
			throw new RequestError(400, 'invalid or expired verification token');

		await db.update(users).set({ verified: true }).where(eq(users.id, row.userId));
		await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
		return row.userId;
	}

	private async removeExpired(): Promise<void> {
		await db
			.delete(emailVerificationTokens)
			.where(lt(emailVerificationTokens.expiresAt, sql`NOW()`));
	}
}

export const emailVerificationRepo = new EmailVerificationRepo();
