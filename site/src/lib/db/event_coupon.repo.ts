import { randomBytes } from 'crypto';
import { and, eq, isNull, isNotNull, sql, sum } from 'drizzle-orm';
import { db } from './mysql';
import { eventCoupons, users } from './schema';

export type EventCoupon = {
	id: number;
	userId: number;
	userName: string;
	code: string;
	type: 'budget';
	value: number;
	redeemed: boolean;
};

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
	const bytes = randomBytes(8);
	let code = '';
	for (let i = 0; i < 8; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
	return code;
}

class EventCouponRepo {
	public async getAllByEvent(eventId: number): Promise<EventCoupon[]> {
		const rows = await db
			.select({
				id: eventCoupons.id,
				userId: eventCoupons.userId,
				userName: users.name,
				code: eventCoupons.code,
				type: eventCoupons.type,
				value: eventCoupons.value,
				redeemedAt: eventCoupons.redeemedAt
			})
			.from(eventCoupons)
			.innerJoin(users, eq(users.id, eventCoupons.userId))
			.where(eq(eventCoupons.eventId, eventId));

		return rows.map(({ redeemedAt, userName, ...rest }) => ({
			...rest,
			userName: userName ?? '',
			redeemed: redeemedAt != null
		}));
	}

	public async getRedeemedBudgetSumForUser(eventId: number, userId: number): Promise<number> {
		const [row] = await db
			.select({ total: sum(eventCoupons.value) })
			.from(eventCoupons)
			.where(
				and(
					eq(eventCoupons.eventId, eventId),
					eq(eventCoupons.userId, userId),
					eq(eventCoupons.type, 'budget'),
					isNotNull(eventCoupons.redeemedAt)
				)
			);
		return Number(row?.total ?? 0);
	}

	public async create(
		eventId: number,
		userId: number,
		value: number
	): Promise<{ id: number; code: string }> {
		const code = generateCode();
		const [result] = await db
			.insert(eventCoupons)
			.values({ eventId, userId, code, type: 'budget', value });
		return { id: result.insertId, code };
	}

	public async delete(couponId: number): Promise<void> {
		await db.delete(eventCoupons).where(eq(eventCoupons.id, couponId));
	}

	public async findUnredeemedByCode(
		eventId: number,
		userId: number,
		code: string
	): Promise<{ id: number; value: number } | undefined> {
		const [row] = await db
			.select({ id: eventCoupons.id, value: eventCoupons.value })
			.from(eventCoupons)
			.where(
				and(
					eq(eventCoupons.eventId, eventId),
					eq(eventCoupons.userId, userId),
					eq(eventCoupons.code, code),
					isNull(eventCoupons.redeemedAt)
				)
			);
		return row;
	}

	public async redeem(couponId: number): Promise<void> {
		await db
			.update(eventCoupons)
			.set({ redeemedAt: sql`NOW()` })
			.where(eq(eventCoupons.id, couponId));
	}
}

export const eventCouponRepo = new EventCouponRepo();
