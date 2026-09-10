import { mysqlconnFn } from './mysql';

export type CompanyDiscounts = {
	items: { itemId: number; discount: number }[];
	implants: { implantId: number; discount: number }[];
	expertise: { expertiseId: number; discount: number }[];
};

class CompanyDiscountsRepo {
	public async getByCompany(companyId: number): Promise<CompanyDiscounts> {
		const connection = await mysqlconnFn();

		const [items] = await connection.execute(
			`SELECT Item as itemId, Discount as discount FROM Company_Discounts_Items WHERE Company = ?`,
			[companyId]
		);
		const [implants] = await connection.execute(
			`SELECT Implant as implantId, Discount as discount FROM Company_Discounts_Implants WHERE Company = ?`,
			[companyId]
		);
		const [expertise] = await connection.execute(
			`SELECT Expertise as expertiseId, Discount as discount FROM Company_Discounts_Expertise WHERE Company = ?`,
			[companyId]
		);

		return {
			items: Array.isArray(items) ? (items as { itemId: number; discount: number }[]) : [],
			implants: Array.isArray(implants)
				? (implants as { implantId: number; discount: number }[])
				: [],
			expertise: Array.isArray(expertise) ? (expertise as { expertiseId: number; discount: number }[]) : []
		};
	}

	public async setDiscounts(companyId: number, discounts: CompanyDiscounts): Promise<void> {
		const connection = await mysqlconnFn().getConnection();
		await connection.beginTransaction();
		try {
			await connection.execute(`DELETE FROM Company_Discounts_Items WHERE Company = ?`, [companyId]);
			await connection.execute(`DELETE FROM Company_Discounts_Implants WHERE Company = ?`, [companyId]);
			await connection.execute(`DELETE FROM Company_Discounts_Expertise WHERE Company = ?`, [companyId]);

			for (const { itemId, discount } of discounts.items) {
				await connection.execute(
					`INSERT INTO Company_Discounts_Items (Company, Item, Discount) VALUES (?, ?, ?)`,
					[companyId, itemId, discount]
				);
			}
			for (const { implantId, discount } of discounts.implants) {
				await connection.execute(
					`INSERT INTO Company_Discounts_Implants (Company, Implant, Discount) VALUES (?, ?, ?)`,
					[companyId, implantId, discount]
				);
			}
			for (const { expertiseId, discount } of discounts.expertise) {
				await connection.execute(
					`INSERT INTO Company_Discounts_Expertise (Company, Expertise, Discount) VALUES (?, ?, ?)`,
					[companyId, expertiseId, discount]
				);
			}

			await connection.commit();
		} catch (err) {
			await connection.rollback();
			throw err;
		} finally {
			connection.release();
		}
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
