<script lang="ts">
	import CharacterEditor from './character-editor.svelte';
	import CharacterCreateNav, { type Step } from './character-create-nav.svelte';
	import ShopExpertise, { type ShopExpertise as ShopExpertiseType } from './shop-expertise.svelte';
	import ShopItems, { type ShopItem } from './shop-items.svelte';
	import ShopImplants, { type ShopImplant } from './shop-implants.svelte';
	import type { Character, CharacterVersionFull } from '$lib/managers/character-manager.svelte';
	import type { ExpertiseManager } from '$lib/managers/expertise-manager.svelte';
	import type { RegisterManager } from '$lib/managers/register-manager.svelte';
	import { cumulativeExpertiseCost } from '$lib/utils/point-cost';

	let {
		character = $bindable(),
		version = $bindable(),
		expertise = [],
		items = [],
		implants = [],
		budget = 0,
		expertiseManager,
		REGISTER_MANAGER
	}: {
		character: Character;
		version: CharacterVersionFull;
		expertise?: ShopExpertiseType[];
		items?: ShopItem[];
		implants?: ShopImplant[];
		budget?: number;
		expertiseManager?: ExpertiseManager;
		REGISTER_MANAGER?: RegisterManager;
	} = $props();

	type DiscountEntry = { id: number; discount: number };
	type Discounts = {
		expertise: DiscountEntry[];
		items: DiscountEntry[];
		implants: DiscountEntry[];
	};

	let activeStep = $state<Step>('details');
	let discounts = $state<Discounts | null>(null);
	let pointCosts = $state<Map<number, number>>(new Map());

	$effect(() => {
		fetch('/api/expertise/point-costs')
			.then((r) => (r.ok ? r.json() : []))
			.then((rows: { point: number; cost: number }[]) => {
				pointCosts = new Map(rows.map(({ point, cost }) => [point, cost]));
			});
	});

	$effect(() => {
		const companyId = version.company?.id;
		if (companyId == null) {
			discounts = null;
			return;
		}
		fetch(`/api/companies/${companyId}/discounts`)
			.then((r) => (r.ok ? r.json() : null))
			.then(
				(
					d: {
						expertise: { expertiseId: number; discount: number }[];
						items: { itemId: number; discount: number }[];
						implants: { implantId: number; discount: number }[];
					} | null
				) => {
					if (d == null) return;
					discounts = {
						expertise: d.expertise.map(({ expertiseId, discount }) => ({
							id: expertiseId,
							discount
						})),
						items: d.items.map(({ itemId, discount }) => ({ id: itemId, discount })),
						implants: d.implants.map(({ implantId, discount }) => ({ id: implantId, discount }))
					};
				}
			);
	});

	const itemCostById = $derived(new Map(items.map((i) => [i.id, i.cost ?? 0])));
	const implantCostById = $derived(new Map(implants.map((i) => [i.id, i.cost ?? 0])));

	const expertiseDiscountById = $derived(
		new Map((discounts?.expertise ?? []).map((d) => [d.id, d.discount]))
	);
	const itemDiscountById = $derived(
		new Map((discounts?.items ?? []).map((d) => [d.id, d.discount]))
	);
	const implantDiscountById = $derived(
		new Map((discounts?.implants ?? []).map((d) => [d.id, d.discount]))
	);

	const expertiseSpent = $derived(
		version.expertise.reduce((sum, e) => {
			const discount = expertiseDiscountById.get(e.id) ?? 0;
			return sum + cumulativeExpertiseCost(e.value, pointCosts, discount);
		}, 0)
	);
	const itemsSpent = $derived(
		version.items.reduce((sum, i) => {
			const cost = itemCostById.get(i.id) ?? 0;
			const discount = itemDiscountById.get(i.id) ?? 0;
			return sum + Math.max(0, cost - discount) * i.count;
		}, 0)
	);
	const itemsTotal = $derived(version.items.reduce((sum, i) => sum + i.count, 0));
	const implantsSpent = $derived(
		version.implants.reduce((sum, i) => {
			const cost = implantCostById.get(i.id) ?? 0;
			const discount = implantDiscountById.get(i.id) ?? 0;
			return sum + Math.max(0, cost - discount);
		}, 0)
	);
	const spent = $derived(expertiseSpent + itemsSpent + implantsSpent);

	// When no budget cap, shops are never blocked; nav hides the budget section.
	const shopRemaining = $derived(budget > 0 ? budget - spent : Infinity);
	const navRemaining = $derived(budget - spent);

	const expertiseForGroups = $derived(
		version.expertise.flatMap((de) => {
			const e = expertise.find((ex) => ex.id === de.id);
			return e
				? [
						{
							id: de.id,
							group: e.groupId,
							groupName: e.groupName,
							value: de.value,
							name: e.name,
							icon: e.icon ?? null,
							groupIcon: e.groupIcon ?? null,
							groupColor: e.groupColor ?? null
						}
					]
				: [];
		})
	);
</script>

<div class="layout">
	<CharacterCreateNav
		bind:activeStep
		name={version.name}
		expertise={{
			count: version.expertise.length,
			groups: expertiseForGroups,
			spent: expertiseSpent
		}}
		items={{ count: version.items.length, total: itemsTotal, spent: itemsSpent }}
		implants={{
			count: version.implants.length,
			spent: implantsSpent,
			slotCount: character.implantLimit ?? 2
		}}
		{budget}
		remaining={navRemaining}
		{expertiseManager}
	/>

	<div class="shop scroll">
		{#if activeStep === 'details'}
			<CharacterEditor bind:character bind:version {REGISTER_MANAGER} />
		{:else if activeStep === 'expertise'}
			<ShopExpertise
				catalog={expertise}
				bind:selected={version.expertise}
				remaining={shopRemaining}
				discounts={expertiseDiscountById}
				{pointCosts}
			/>
		{:else if activeStep === 'items'}
			<ShopItems
				catalog={items}
				bind:selected={version.items}
				remaining={shopRemaining}
				discounts={itemDiscountById}
			/>
		{:else if activeStep === 'implants'}
			<ShopImplants
				catalog={implants}
				bind:selected={version.implants}
				remaining={shopRemaining}
				discounts={implantDiscountById}
				slotCount={character.implantLimit ?? 2}
			/>
		{/if}
	</div>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: 0;
		min-height: 0;
		height: 100%;
	}

	.shop {
		padding: 1rem 1.25rem;
		overflow-y: auto;
		height: 100%;
	}
</style>
