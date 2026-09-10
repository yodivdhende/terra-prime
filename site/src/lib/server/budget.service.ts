import { companyDiscountsRepo } from '$lib/db/company_discounts.repo';
import type { CharacterVersionBare } from '$lib/db/character_version.repo';
import { eventCouponRepo } from '$lib/db/event_coupon.repo';
import { eventParticipantsRepo } from '$lib/db/event_participants.repo';
import { eventRepo } from '$lib/db/event.repo';
import { expertisePointCostsRepo } from '$lib/db/expertise_point_costs.repo';
import { implantRepo } from '$lib/db/implants.repo';
import { itemRepo } from '$lib/db/items.repo';
import { applyDiscount } from '$lib/utils/discount';
import { cumulativeExpertiseCost } from '$lib/utils/point-cost';

export async function getAvailableBudget({
	eventId,
	characterId,
	ownerId
}: {
	eventId: number;
	characterId: number;
	ownerId: number;
}): Promise<number> {
	const [event, priorReward, couponBudget] = await Promise.all([
		eventRepo.getWithId(eventId),
		eventParticipantsRepo.getSumPriorRewardBudget({ characterId, excludeEventId: eventId }),
		eventCouponRepo.getRedeemedBudgetSumForUser(eventId, ownerId)
	]);
	return (event?.budget ?? 0) + priorReward + couponBudget;
}

export async function computeCharacterVersionCost(version: CharacterVersionBare): Promise<number> {
	const [pointCosts, allItems, allImplants, discounts] = await Promise.all([
		expertisePointCostsRepo.getAll(),
		itemRepo.getAll(),
		implantRepo.getAll(),
		version.company ? companyDiscountsRepo.getByCompany(version.company) : Promise.resolve(null)
	]);

	const pointCostByPoint = new Map(pointCosts.map((p) => [p.point, p.cost]));
	const itemCostById = new Map(allItems.map((i) => [i.id, i.cost ?? 0]));
	const implantCostById = new Map(allImplants.map((i) => [i.id, i.cost ?? 0]));

	const expertiseDiscountById = new Map(
		(discounts?.expertise ?? []).map((d) => [d.expertiseId, d.discount])
	);
	const itemDiscountById = new Map((discounts?.items ?? []).map((d) => [d.itemId, d.discount]));
	const implantDiscountById = new Map(
		(discounts?.implants ?? []).map((d) => [d.implantId, d.discount])
	);

	const expertiseSpent = version.expertise.reduce((sum, e) => {
		const discount = expertiseDiscountById.get(e.id) ?? 0;
		return sum + cumulativeExpertiseCost(e.value, pointCostByPoint, discount);
	}, 0);
	const itemsSpent = version.items.reduce((sum, i) => {
		const cost = itemCostById.get(i.id) ?? 0;
		const discount = itemDiscountById.get(i.id) ?? 0;
		return sum + applyDiscount(cost, discount) * i.count;
	}, 0);
	const implantsSpent = version.implants.reduce((sum, i) => {
		const cost = implantCostById.get(i.id) ?? 0;
		const discount = implantDiscountById.get(i.id) ?? 0;
		return sum + applyDiscount(cost, discount);
	}, 0);

	return expertiseSpent + itemsSpent + implantsSpent;
}
