/**
 * Total cost of reaching `value` points, given a shared point-cost table
 * (point -> cost of that single point) and a per-point discount.
 */
export function cumulativeExpertiseCost(
	value: number,
	costByPoint: Map<number, number>,
	discount = 0
): number {
	let total = 0;
	for (let point = 1; point <= value; point++) {
		total += Math.max(0, (costByPoint.get(point) ?? 0) - discount);
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
	costByPoint: Map<number, number>,
	discount = 0
): number {
	if (target <= current) return Math.max(0, target);
	let value = current;
	let spent = 0;
	for (let point = current + 1; point <= target; point++) {
		const pointCost = Math.max(0, (costByPoint.get(point) ?? 0) - discount);
		if (spent + pointCost > remaining) break;
		spent += pointCost;
		value = point;
	}
	return value;
}
