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
	import CharacterSkillGroups from './character-skill-groups.svelte';
	import ShopSkills, { type ShopSkill } from './shop-skills.svelte';
	import ShopItems, { type ShopItem } from './shop-items.svelte';
	import ShopImplants, { type ShopImplant } from './shop-implants.svelte';
	import Icon from './icon.svelte';
	import itemLogo from '$lib/assets/images/ItemLogo.svg?raw';

	type EventResponse = {
		id: number;
		name: string;
		budget?: number | null;
	};

	type Step = 'details' | 'skills' | 'items' | 'implants';

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
			<nav class="nav">
				<ul class="steps">
					<li class="step" class:active={activeStep === 'details'}>
						<button type="button" onclick={() => (activeStep = 'details')}>
							<span class="step-label">details</span>
							<span class="step-overview">
								<span class="overview-name" class:empty={!draft.name.trim()}>
									{draft.name.trim() || '—'}
								</span>
							</span>
						</button>
					</li>

					<li class="step" class:active={activeStep === 'skills'}>
						<button type="button" onclick={() => (activeStep = 'skills')}>
							<span class="step-label">
								skills
								{#if draft.skills.length > 0}
									<span class="step-count">{draft.skills.length}</span>
								{/if}
							</span>
							<span class="step-overview">
								{#if skillsForGroups.length > 0}
									<CharacterSkillGroups skills={skillsForGroups} />
								{:else}
									<span class="overview-empty">none selected</span>
								{/if}
								{#if skillsSpent > 0}
									<span class="overview-cost">{skillsSpent}</span>
								{/if}
							</span>
						</button>
					</li>

					<li class="step" class:active={activeStep === 'items'}>
						<button type="button" onclick={() => (activeStep = 'items')}>
							<span class="step-label">
								items
								{#if draft.items.length > 0}
									<span class="step-count">{draft.items.length}</span>
								{/if}
							</span>
							<span class="step-overview">
								{#if itemsTotal > 0}
									<span class="overview-stat">
										<Icon src={itemLogo} color="white" tooltip="Items" />
										{itemsTotal}
									</span>
									<span class="overview-cost">{itemsSpent}</span>
								{:else}
									<span class="overview-empty">none selected</span>
								{/if}
							</span>
						</button>
					</li>

					<li class="step" class:active={activeStep === 'implants'}>
						<button type="button" onclick={() => (activeStep = 'implants')}>
							<span class="step-label">
								implants
								{#if draft.implants.length > 0}
									<span class="step-count">{draft.implants.length}</span>
								{/if}
							</span>
							<span class="step-overview">
								{#if draft.implants.length > 0}
									<span class="overview-stat">{draft.implants.length} selected</span>
									<span class="overview-cost">{implantsSpent}</span>
								{:else}
									<span class="overview-empty">none selected</span>
								{/if}
							</span>
						</button>
					</li>
				</ul>

				<div class="budget" class:over={remaining < 0}>
					<span class="budget-label">total cost</span>
					<span class="budget-value">
						<span class="remaining">{remaining}</span>
						<span class="sep">/</span>
						<span class="total">{budget}</span>
					</span>
				</div>
			</nav>

			<div class="shop">
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

	/* ── Nav ── */

	.nav {
		display: flex;
		flex-direction: column;
		border-right: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
		overflow-y: auto;
	}

	.steps {
		list-style: none;
		margin: 0;
		padding: 0;
		flex: 1;
	}

	.step button {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.75rem 0.85rem;
		background: transparent;
		border: none;
		border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 10%, transparent);
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
	}

	.step button:hover {
		background: color-mix(in srgb, var(--color-accent) 5%, transparent);
	}

	.step.active button {
		background: color-mix(in srgb, var(--color-accent) 10%, transparent);
		border-left: 2px solid var(--color-accent);
		padding-left: calc(0.85rem - 2px);
	}

	.step-label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-main);
		opacity: 0.55;
	}

	.step.active .step-label {
		color: var(--color-accent);
		opacity: 0.9;
	}

	.step-count {
		font-size: 0.6rem;
		padding: 0.05rem 0.35rem;
		background: color-mix(in srgb, var(--color-accent) 20%, transparent);
		color: var(--color-accent);
		border-radius: 999px;
		letter-spacing: 0;
	}

	.step-overview {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.4rem;
		min-height: 1.2rem;
	}

	.overview-name {
		font-size: 0.75rem;
		color: var(--color-main);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.overview-name.empty {
		opacity: 0.3;
	}

	.overview-empty {
		font-size: 0.65rem;
		opacity: 0.3;
		font-style: italic;
	}

	.overview-stat {
		font-size: 0.7rem;
		opacity: 0.65;
	}

	.overview-cost {
		font-size: 0.7rem;
		color: var(--color-accent);
		opacity: 0.75;
		margin-left: auto;
		flex-shrink: 0;
	}

	/* ── Budget footer ── */

	.budget {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.75rem 0.85rem;
		border-top: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
	}

	.budget-label {
		font-size: 0.6rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.45;
	}

	.budget-value {
		font-size: 0.9rem;
		color: var(--color-accent);
		letter-spacing: 0.04em;
	}

	.budget.over .remaining {
		color: #d95c5c;
	}

	.sep {
		opacity: 0.3;
		margin: 0 0.2rem;
	}

	.total {
		opacity: 0.45;
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
