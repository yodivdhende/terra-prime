<script lang="ts">
	import CharacterEditor from './character-editor.svelte';
	import CharacterCreateNav, { type Step } from './character-create-nav.svelte';
	import ShopSkills, { type ShopSkill } from './shop-skills.svelte';
	import ShopItems, { type ShopItem } from './shop-items.svelte';
	import ShopImplants, { type ShopImplant } from './shop-implants.svelte';
	import type { Character, CharacterVersionFull } from '../managers/character-manager.svelte';

	let {
		character = $bindable(),
		version = $bindable(),
		skills = [],
		items = [],
		implants = [],
		budget = 0
	}: {
		character: Character;
		version: CharacterVersionFull;
		skills?: ShopSkill[];
		items?: ShopItem[];
		implants?: ShopImplant[];
		budget?: number;
	} = $props();

	type DiscountEntry = { id: number; discount: number };
	type Discounts = { skills: DiscountEntry[]; items: DiscountEntry[]; implants: DiscountEntry[] };

	let activeStep = $state<Step>('details');
	let discounts = $state<Discounts | null>(null);

	$effect(() => {
		const companyId = version.company?.id;
		if (companyId == null) {
			discounts = null;
			return;
		}
		fetch(`/api/companies/${companyId}/discounts`)
			.then((r) => (r.ok ? r.json() : null))
			.then((d: { skills: { skillId: number; discount: number }[]; items: { itemId: number; discount: number }[]; implants: { implantId: number; discount: number }[] } | null) => {
				if (d == null) return;
				discounts = {
					skills: d.skills.map(({ skillId, discount }) => ({ id: skillId, discount })),
					items: d.items.map(({ itemId, discount }) => ({ id: itemId, discount })),
					implants: d.implants.map(({ implantId, discount }) => ({ id: implantId, discount }))
				};
			});
	});

	const skillCostById = $derived(new Map(skills.map((s) => [s.id, s.cost ?? 0])));
	const itemCostById = $derived(new Map(items.map((i) => [i.id, i.cost ?? 0])));
	const implantCostById = $derived(new Map(implants.map((i) => [i.id, i.cost ?? 0])));

	const skillDiscountById = $derived(new Map((discounts?.skills ?? []).map((d) => [d.id, d.discount])));
	const itemDiscountById = $derived(new Map((discounts?.items ?? []).map((d) => [d.id, d.discount])));
	const implantDiscountById = $derived(new Map((discounts?.implants ?? []).map((d) => [d.id, d.discount])));

	const skillsSpent = $derived(
		version.skills.reduce((sum, s) => {
			const cost = skillCostById.get(s.id) ?? 0;
			const discount = skillDiscountById.get(s.id) ?? 0;
			return sum + Math.max(0, cost - discount) * s.value;
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
	const spent = $derived(skillsSpent + itemsSpent + implantsSpent);

	// When no budget cap, shops are never blocked; nav hides the budget section.
	const shopRemaining = $derived(budget > 0 ? budget - spent : Infinity);
	const navRemaining = $derived(budget - spent);

	const skillsForGroups = $derived(
		version.skills.flatMap((ds) => {
			const s = skills.find((sk) => sk.id === ds.id);
			return s ? [{ id: ds.id, group: s.groupId, groupName: s.groupName, value: ds.value }] : [];
		})
	);
</script>

<div class="layout">
	<CharacterCreateNav
		bind:activeStep
		name={version.name}
		skills={{ count: version.skills.length, groups: skillsForGroups, spent: skillsSpent }}
		items={{ count: version.items.length, total: itemsTotal, spent: itemsSpent }}
		implants={{ count: version.implants.length, spent: implantsSpent, slotCount: character.implantLimit ?? 2 }}
		{budget}
		remaining={navRemaining}
	/>

	<div class="shop scroll">
		{#if activeStep === 'details'}
			<CharacterEditor bind:character bind:version />
		{:else if activeStep === 'skills'}
			<ShopSkills
				catalog={skills}
				bind:selected={version.skills}
				remaining={shopRemaining}
				discounts={skillDiscountById}
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
		height: 100%;
		min-height: 0;
	}

	.shop {
		padding: 1rem 1.25rem;
		overflow-y: auto;
	}
</style>
