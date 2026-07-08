import { randomBytes } from 'crypto';
import { mysqlconnFn } from './mysql';

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
		const connection = await mysqlconnFn();
		const [result] = await connection.execute(
			`SELECT ec.Id as id, ec.User as userId, u.Name as userName, ec.Code as code, ec.Type as type, ec.Value as value, ec.RedeemedAt as redeemedAt
       FROM Event_Coupons ec
       JOIN Users u ON u.Id = ec.User
       WHERE ec.Event = ?`,
			[eventId]
		);
		if (!Array.isArray(result)) return [];
		return (result as any[]).map((r) => ({
			id: r.id,
			userId: r.userId,
			userName: r.userName,
			code: r.code,
			type: r.type,
			value: r.value,
			redeemed: r.redeemedAt != null
		}));
	}

	public async getRedeemedBudgetSumForUser(eventId: number, userId: number): Promise<number> {
		const connection = await mysqlconnFn();
		const [result] = await connection.execute(
			`SELECT COALESCE(SUM(Value), 0) as total FROM Event_Coupons
       WHERE Event = ? AND User = ? AND Type = 'budget' AND RedeemedAt IS NOT NULL`,
			[eventId, userId]
		);
		if (!Array.isArray(result) || result.length === 0) return 0;
		return Number((result[0] as { total: number }).total);
	}

	public async create(eventId: number, userId: number, value: number): Promise<{ id: number; code: string }> {
		const connection = await mysqlconnFn();
		const code = generateCode();
		const [result] = await connection.execute(
			`INSERT INTO Event_Coupons (Event, User, Code, Type, Value) VALUES (?, ?, ?, 'budget', ?)`,
			[eventId, userId, code, value]
		);
		return { id: (result as any).insertId as number, code };
	}

	public async delete(couponId: number): Promise<void> {
		const connection = await mysqlconnFn();
		await connection.execute(`DELETE FROM Event_Coupons WHERE Id = ?`, [couponId]);
	}

	public async findUnredeemedByCode(
		eventId: number,
		userId: number,
		code: string
	): Promise<{ id: number; value: number } | undefined> {
		const connection = await mysqlconnFn();
		const [result] = await connection.execute(
			`SELECT Id as id, Value as value FROM Event_Coupons
       WHERE Event = ? AND User = ? AND Code = ? AND RedeemedAt IS NULL`,
			[eventId, userId, code]
		);
		if (!Array.isArray(result) || result.length === 0) return undefined;
		return result[0] as { id: number; value: number };
	}

	public async redeem(couponId: number): Promise<void> {
		const connection = await mysqlconnFn();
		await connection.execute(`UPDATE Event_Coupons SET RedeemedAt = NOW() WHERE Id = ?`, [couponId]);
	}
}

export const eventCouponRepo = new EventCouponRepo();
