import { eq } from 'drizzle-orm';
import { db } from './mysql';
import {
	companyDiscountsExpertise,
	companyDiscountsImplants,
	companyDiscountsItems
} from './schema';

export type CompanyDiscounts = {
	items: { itemId: number; discount: number }[];
	implants: { implantId: number; discount: number }[];
	expertise: { expertiseId: number; discount: number }[];
};

class CompanyDiscountsRepo {
	public async getByCompany(companyId: number): Promise<CompanyDiscounts> {
		const [items, implants, expertise] = await Promise.all([
			db
				.select({ itemId: companyDiscountsItems.itemId, discount: companyDiscountsItems.discount })
				.from(companyDiscountsItems)
				.where(eq(companyDiscountsItems.companyId, companyId)),
			db
				.select({
					implantId: companyDiscountsImplants.implantId,
					discount: companyDiscountsImplants.discount
				})
				.from(companyDiscountsImplants)
				.where(eq(companyDiscountsImplants.companyId, companyId)),
			db
				.select({
					expertiseId: companyDiscountsExpertise.expertiseId,
					discount: companyDiscountsExpertise.discount
				})
				.from(companyDiscountsExpertise)
				.where(eq(companyDiscountsExpertise.companyId, companyId))
		]);

		return { items, implants, expertise };
	}

	public async setDiscounts(companyId: number, discounts: CompanyDiscounts): Promise<void> {
		await db.transaction(async (tx) => {
			await tx.delete(companyDiscountsItems).where(eq(companyDiscountsItems.companyId, companyId));
			await tx
				.delete(companyDiscountsImplants)
				.where(eq(companyDiscountsImplants.companyId, companyId));
			await tx
				.delete(companyDiscountsExpertise)
				.where(eq(companyDiscountsExpertise.companyId, companyId));

			if (discounts.items.length > 0)
				await tx
					.insert(companyDiscountsItems)
					.values(discounts.items.map((row) => ({ companyId, ...row })));
			if (discounts.implants.length > 0)
				await tx
					.insert(companyDiscountsImplants)
					.values(discounts.implants.map((row) => ({ companyId, ...row })));
			if (discounts.expertise.length > 0)
				await tx
					.insert(companyDiscountsExpertise)
					.values(discounts.expertise.map((row) => ({ companyId, ...row })));
		});
	}
}

export const companyDiscountsRepo = new CompanyDiscountsRepo();

function isDiscountRow(row: unknown, idKey: string): boolean {
	if (typeof row !== 'object' || row === null) return false;
	const record = row as Record<string, unknown>;
	return (
		idKey in record &&
		typeof record[idKey] === 'number' &&
		'discount' in record &&
		typeof record.discount === 'number' &&
		record.discount >= 0 &&
		record.discount <= 100
	);
}

export function isCompanyDiscounts(obj: unknown): obj is CompanyDiscounts {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'items' in obj &&
		Array.isArray(obj.items) &&
		obj.items.every((row) => isDiscountRow(row, 'itemId')) &&
		'implants' in obj &&
		Array.isArray(obj.implants) &&
		obj.implants.every((row) => isDiscountRow(row, 'implantId')) &&
		'expertise' in obj &&
		Array.isArray(obj.expertise) &&
		obj.expertise.every((row) => isDiscountRow(row, 'expertiseId'))
	);
}
