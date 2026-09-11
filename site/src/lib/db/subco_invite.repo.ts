import { and, desc, eq, isNull, lt, or, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { RequestError } from '$lib/types/errors';
import { db } from './mysql';
import { subco, subcoInvites } from './schema';

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
		const token = uuidv4();
		await db.insert(subcoInvites).values({
			token,
			subcoId,
			email,
			expiresAt: sql`NOW() + INTERVAL 7 DAY`,
			status: 'invited'
		});
		return token;
	}

	public async insertDirect({ subcoId, email }: { subcoId: number; email: string }): Promise<void> {
		await db.insert(subcoInvites).values({
			token: uuidv4(),
			subcoId,
			email,
			expiresAt: null,
			status: 'accepted'
		});
	}

	public async consumeToken(token: string): Promise<{ subcoId: number; email: string }> {
		const [row] = await db
			.select({
				subcoId: subcoInvites.subcoId,
				email: subcoInvites.email,
				expiresAt: subcoInvites.expiresAt
			})
			.from(subcoInvites)
			.where(eq(subcoInvites.token, token));
		if (row == null) throw new RequestError(400, 'invalid or expired invite token');
		if (row.expiresAt != null && row.expiresAt.getTime() < Date.now())
			throw new RequestError(400, 'invalid or expired invite token');

		await db.update(subcoInvites).set({ status: 'accepted' }).where(eq(subcoInvites.token, token));
		return { subcoId: row.subcoId, email: row.email };
	}

	public async setStatus({
		token,
		status
	}: {
		token: string;
		status: InviteStatus;
	}): Promise<void> {
		await db.update(subcoInvites).set({ status }).where(eq(subcoInvites.token, token));
	}

	public async getBySubco({ subcoId }: { subcoId: number }): Promise<InviteRecord[]> {
		const rows = await db
			.select({
				token: subcoInvites.token,
				email: subcoInvites.email,
				status: subcoInvites.status,
				createdAt: subcoInvites.createdAt
			})
			.from(subcoInvites)
			.where(eq(subcoInvites.subcoId, subcoId))
			.orderBy(desc(subcoInvites.createdAt));
		return rows.map((row) => ({ ...row, status: row.status as InviteStatus }));
	}

	public async getByToken({
		token
	}: {
		token: string;
	}): Promise<InviteRecord & { subcoId: number }> {
		const [row] = await db
			.select({
				token: subcoInvites.token,
				subcoId: subcoInvites.subcoId,
				email: subcoInvites.email,
				status: subcoInvites.status,
				createdAt: subcoInvites.createdAt
			})
			.from(subcoInvites)
			.where(eq(subcoInvites.token, token));
		if (row == null) throw new RequestError(404, 'invite not found');
		return { ...row, status: row.status as InviteStatus };
	}

	public async extendAndReset({ token }: { token: string }): Promise<void> {
		await db
			.update(subcoInvites)
			.set({ status: 'invited', expiresAt: sql`NOW() + INTERVAL 7 DAY` })
			.where(eq(subcoInvites.token, token));
	}

	public async getPendingForEmail({ email }: { email: string }): Promise<PendingInvite[]> {
		const rows = await db
			.select({
				token: subcoInvites.token,
				subcoId: subcoInvites.subcoId,
				subcoName: subco.name,
				company: subco.companyId
			})
			.from(subcoInvites)
			.innerJoin(subco, eq(subco.id, subcoInvites.subcoId))
			.where(
				and(
					eq(subcoInvites.email, email),
					eq(subcoInvites.status, 'invited'),
					or(isNull(subcoInvites.expiresAt), sql`${subcoInvites.expiresAt} > NOW()`)
				)
			);
		return rows.map((row) => ({ ...row, subcoName: row.subcoName ?? '' }));
	}

	public async deleteByToken({ token }: { token: string }): Promise<void> {
		await db.delete(subcoInvites).where(eq(subcoInvites.token, token));
	}

	private async removeExpired(): Promise<void> {
		await db
			.delete(subcoInvites)
			.where(and(eq(subcoInvites.status, 'invited'), lt(subcoInvites.expiresAt, new Date())));
	}
}

export const subcoInviteRepo = new SubcoInviteRepo();

export type PendingInvite = { token: string; subcoId: number; subcoName: string; company: number };
