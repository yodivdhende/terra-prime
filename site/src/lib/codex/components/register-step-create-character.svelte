<script lang="ts" module>
	export type CharacterDraftSkill = { id: number; value: number };
	export type CharacterDraftItem = { id: number; count: number };
	export type CharacterDraft = {
		name: string;
		skills: CharacterDraftSkill[];
		items: CharacterDraftItem[];
		implants: number[];
	};
</script>

<script lang="ts">
	import CharacterNameInput from './character-name-input.svelte';
	import CharacterCreateNav, { type Step } from './character-create-nav.svelte';
	import ShopSkills, { type ShopSkill } from './shop-skills.svelte';
	import ShopItems, { type ShopItem } from './shop-items.svelte';
	import ShopImplants, { type ShopImplant } from './shop-implants.svelte';

	type EventResponse = {
		id: number;
		name: string;
		budget?: number | null;
	};

	let {
		draft = $bindable<CharacterDraft>({ name: '', skills: [], items: [], implants: [] }),
		selectedEventId
	}: {
		draft: CharacterDraft;
		selectedEventId: number;
	} = $props();

	let skills = $state<ShopSkill[]>([]);
	let items = $state<ShopItem[]>([]);
	let implants = $state<ShopImplant[]>([]);
	let budget = $state<number>(0);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeStep = $state<Step>('details');

	const skillCostById = $derived(new Map(skills.map((s) => [s.id, s.cost ?? 0])));
	const itemCostById = $derived(new Map(items.map((i) => [i.id, i.cost ?? 0])));
	const implantCostById = $derived(new Map(implants.map((i) => [i.id, i.cost ?? 0])));

	const skillsSpent = $derived(
		draft.skills.reduce((sum, s) => sum + (skillCostById.get(s.id) ?? 0) * s.value, 0)
	);
	const itemsSpent = $derived(
		draft.items.reduce((sum, i) => sum + (itemCostById.get(i.id) ?? 0) * i.count, 0)
	);
	const itemsTotal = $derived(draft.items.reduce((sum, i) => sum + i.count, 0));
	const implantsSpent = $derived(
		draft.implants.reduce((sum, id) => sum + (implantCostById.get(id) ?? 0), 0)
	);
	const spent = $derived(skillsSpent + itemsSpent + implantsSpent);
	const remaining = $derived(budget - spent);

	const skillsForGroups = $derived(
		draft.skills.flatMap((ds) => {
			const s = skills.find((sk) => sk.id === ds.id);
			return s ? [{ id: ds.id, group: s.groupId, groupName: s.groupName, value: ds.value }] : [];
		})
	);

	$effect(() => {
		load(selectedEventId);
	});

	async function load(eventId: number) {
		loading = true;
		error = null;
		try {
			const [skillsRes, itemsRes, implantsRes, eventRes] = await Promise.all([
				fetch('/api/skills'),
				fetch('/api/items'),
				fetch('/api/implants'),
				fetch(`/api/events/${eventId}`)
			]);

			if (skillsRes.ok) skills = await skillsRes.json();
			if (itemsRes.ok) items = await itemsRes.json();
			if (implantsRes.ok) implants = await implantsRes.json();
			if (eventRes.ok) {
				const event: EventResponse = await eventRes.json();
				budget = event.budget ?? 0;
			}
		} catch (err) {
			error = `${err}`;
		} finally {
			loading = false;
		}
	}
</script>

<div class="create-character">
	{#if loading}
		<p class="status">loading…</p>
	{:else if error}
		<p class="status error">failed to load: {error}</p>
	{:else}
		<div class="layout">
			<CharacterCreateNav
				bind:activeStep
				name={draft.name}
				skills={{ count: draft.skills.length, groups: skillsForGroups, spent: skillsSpent }}
				items={{ count: draft.items.length, total: itemsTotal, spent: itemsSpent }}
				implants={{ count: draft.implants.length, spent: implantsSpent }}
				{budget}
				{remaining}
			/>

			<div class="shop scroll">
				{#if activeStep === 'details'}
					<CharacterNameInput bind:value={draft.name} />
				{:else if activeStep === 'skills'}
					<ShopSkills catalog={skills} bind:selected={draft.skills} {remaining} />
				{:else if activeStep === 'items'}
					<ShopItems catalog={items} bind:selected={draft.items} {remaining} />
				{:else if activeStep === 'implants'}
					<ShopImplants catalog={implants} bind:selected={draft.implants} {remaining} />
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.create-character {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.layout {
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: 0;
		height: 100%;
		min-height: 0;
	}

	/* ── Shop pane ── */

	.shop {
		padding: 1rem 1.25rem;
		overflow-y: auto;
	}

	/* ── Status ── */

	.status {
		font-size: 0.75rem;
		opacity: 0.4;
	}

	.status.error {
		color: #d95c5c;
		opacity: 0.7;
	}
</style>
