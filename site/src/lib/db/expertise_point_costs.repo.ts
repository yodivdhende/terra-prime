import { mysqlconnFn } from './mysql';

export type ExpertisePointCost = { point: number; cost: number };

class ExpertisePointCostsRepo {
	/**
	 * The point-cost breakpoint rows (point in 0-100), ordered by point. `cost` is the cumulative
	 * total cost of reaching that point. This is a sparse, admin-edited set of breakpoints, not one
	 * row per point — the cost at a point between two breakpoints is linearly interpolated, see
	 * `src/lib/utils/point-cost.ts`.
	 */
	public async getAll(): Promise<ExpertisePointCost[]> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`SELECT Point as point, Cost as cost FROM Expertise_Point_Costs ORDER BY Point`
		);
		if (Array.isArray(result) === false) return [];
		const pointCosts: ExpertisePointCost[] = [];
		for (const row of result) {
			if (isExpertisePointCost(row)) pointCosts.push(row);
			else
				console.error(
					`%c sql result is not an expertise point cost`,
					`background:red;color:black`,
					{
						row
					}
				);
		}
		return pointCosts;
	}

	/** Replace the breakpoint rows wholesale — admin can freely add, edit, or remove rows. */
	public async saveAll(items: ExpertisePointCost[]) {
		const valid = items.filter(isExpertisePointCost);
		const connection = await mysqlconnFn().getConnection();
		await connection.beginTransaction();
		try {
			await connection.execute(`DELETE FROM Expertise_Point_Costs`);
			for (const { point, cost } of valid) {
				await connection.execute(
					`INSERT INTO Expertise_Point_Costs (Point, Cost) VALUES (?, ?)`,
					[point, cost]
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

export const expertisePointCostsRepo = new ExpertisePointCostsRepo();

export function isExpertisePointCost(value: unknown): value is ExpertisePointCost {
	return (
		typeof value === 'object' &&
		value !== null &&
		'point' in value &&
		typeof value.point === 'number' &&
		value.point >= 0 &&
		value.point <= 100 &&
		'cost' in value &&
		typeof value.cost === 'number' &&
		value.cost >= 0
	);
}
