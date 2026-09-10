import { applyDiscount } from './discount';

/**
 * Cumulative total cost at `level`, linearly interpolated between the two
 * breakpoints surrounding it in a sparse, admin-edited point-cost table
 * (level -> total cost). Anchored at an implicit (0, 0) breakpoint below the
 * lowest defined row; holds flat past the highest defined row. `levels` must
 * be the sorted keys of `costByLevel`.
 */
function totalAt(level: number, levels: number[], costByLevel: Map<number, number>): number {
	if (level <= 0) return 0;

	let lowerLevel = 0;
	let lowerCost = 0;
	for (const l of levels) {
		if (l <= level) {
			lowerLevel = l;
			lowerCost = costByLevel.get(l) ?? 0;
		} else {
			const upperCost = costByLevel.get(l) ?? 0;
			const t = (level - lowerLevel) / (l - lowerLevel);
			return lowerCost + (upperCost - lowerCost) * t;
		}
	}
	return lowerCost;
}

/** Cost of buying the single point `level`, derived from interpolated cumulative totals. */
function pointCost(level: number, levels: number[], costByLevel: Map<number, number>): number {
	if (level <= 0) return 0;
	return totalAt(level, levels, costByLevel) - totalAt(level - 1, levels, costByLevel);
}

function sortedLevels(costByLevel: Map<number, number>): number[] {
	return Array.from(costByLevel.keys()).sort((a, b) => a - b);
}

/**
 * Total cost of reaching `value` points, given a shared point-cost table
 * (level -> cumulative total cost) and a per-point discount percentage.
 */
export function cumulativeExpertiseCost(
	value: number,
	costByLevel: Map<number, number>,
	discountPercent = 0
): number {
	if (value <= 0) return 0;
	const levels = sortedLevels(costByLevel);
	if (discountPercent <= 0) return Math.floor(totalAt(value, levels, costByLevel));
	let total = 0;
	for (let level = 1; level <= value; level++) {
		total += applyDiscount(pointCost(level, levels, costByLevel), discountPercent);
	}
	return total;
}

/**
 * The largest value reachable from `current` towards `target` without the cost
 * delta exceeding `remaining`. Lowering the value (a refund) is always allowed.
 */
export function maxAffordableExpertiseValue(
	current: number,
	target: number,
	remaining: number,
	costByLevel: Map<number, number>,
	discountPercent = 0
): number {
	if (target <= current) return Math.max(0, target);
	const levels = sortedLevels(costByLevel);
	let value = current;
	let spent = 0;
	for (let level = current + 1; level <= target; level++) {
		const cost = applyDiscount(pointCost(level, levels, costByLevel), discountPercent);
		if (spent + cost > remaining) break;
		spent += cost;
		value = level;
	}
	return value;
}
