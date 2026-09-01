import { mysqlconnFn } from './mysql';

export type ExpertisePointCost = { point: number; cost: number };

class ExpertisePointCostsRepo {
	/** All 20 point/cost rows, ordered by point. */
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

	/** Update the cost for each given point. Points are fixed (1-20) by migration; this never creates or removes rows. */
	public async saveAll(items: ExpertisePointCost[]) {
		const valid = items.filter(isExpertisePointCost);
		if (valid.length === 0) return;
		const connection = mysqlconnFn();
		const placeholders = valid.map(() => '(?,?)').join(',');
		const values = valid.flatMap((i) => [i.point, i.cost]);
		await connection.execute(
			`INSERT INTO Expertise_Point_Costs (Point, Cost) VALUES ${placeholders}
			 ON DUPLICATE KEY UPDATE Cost = VALUES(Cost)`,
			values
		);
	}
}

export const expertisePointCostsRepo = new ExpertisePointCostsRepo();

export function isExpertisePointCost(value: unknown): value is ExpertisePointCost {
	return (
		typeof value === 'object' &&
		value !== null &&
		'point' in value &&
		typeof value.point === 'number' &&
		value.point >= 1 &&
		value.point <= 20 &&
		'cost' in value &&
		typeof value.cost === 'number' &&
		value.cost >= 0
	);
}
