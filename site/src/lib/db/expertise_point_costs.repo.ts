import { asc } from 'drizzle-orm';
import { db } from './mysql';
import { expertisePointCosts } from './schema';

export type ExpertisePointCost = { point: number; cost: number };

class ExpertisePointCostsRepo {
	/**
	 * The point-cost breakpoint rows (point in 0-100), ordered by point. `cost` is the cumulative
	 * total cost of reaching that point. This is a sparse, admin-edited set of breakpoints, not one
	 * row per point — the cost at a point between two breakpoints is linearly interpolated, see
	 * `src/lib/utils/point-cost.ts`.
	 */
	public async getAll(): Promise<ExpertisePointCost[]> {
		return db
			.select({ point: expertisePointCosts.point, cost: expertisePointCosts.cost })
			.from(expertisePointCosts)
			.orderBy(asc(expertisePointCosts.point));
	}

	/** Replace the breakpoint rows wholesale — admin can freely add, edit, or remove rows. */
	public async saveAll(items: ExpertisePointCost[]) {
		const valid = items.filter(isExpertisePointCost);
		await db.transaction(async (tx) => {
			await tx.delete(expertisePointCosts);
			if (valid.length > 0) await tx.insert(expertisePointCosts).values(valid);
		});
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
