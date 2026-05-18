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

	let activeStep = $state<Step>('details');

	const skillCostById = $derived(new Map(skills.map((s) => [s.id, s.cost ?? 0])));
	const itemCostById = $derived(new Map(items.map((i) => [i.id, i.cost ?? 0])));
	const implantCostById = $derived(new Map(implants.map((i) => [i.id, i.cost ?? 0])));

	const skillsSpent = $derived(
		version.skills.reduce((sum, s) => sum + (skillCostById.get(s.id) ?? 0) * s.value, 0)
	);
	const itemsSpent = $derived(
		version.items.reduce((sum, i) => sum + (itemCostById.get(i.id) ?? 0) * i.count, 0)
	);
	const itemsTotal = $derived(version.items.reduce((sum, i) => sum + i.count, 0));
	const implantsSpent = $derived(
		version.implants.reduce((sum, i) => sum + (implantCostById.get(i.id) ?? 0), 0)
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
		implants={{ count: version.implants.length, spent: implantsSpent }}
		{budget}
		remaining={navRemaining}
	/>

	<div class="shop scroll">
		{#if activeStep === 'details'}
			<CharacterEditor bind:character bind:version />
		{:else if activeStep === 'skills'}
			<ShopSkills catalog={skills} bind:selected={version.skills} remaining={shopRemaining} />
		{:else if activeStep === 'items'}
			<ShopItems catalog={items} bind:selected={version.items} remaining={shopRemaining} />
		{:else if activeStep === 'implants'}
			<ShopImplants catalog={implants} bind:selected={version.implants} remaining={shopRemaining} />
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
