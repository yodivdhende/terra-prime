<script lang="ts" module>
	export type ShopExpertise = {
		id: number | null;
		name: string;
		description: string;
		cost?: number;
		groupId: number;
		groupName: string;
	};
</script>

<script lang="ts">
	import Icon from './icon.svelte';
	import ExpertiseSlider from './expertise-slider.svelte';
	import type { VersionExpertise } from '$lib/managers/character-manager.svelte';
	import ProgressBar from './progress-bar.svelte';
	import { GROUP_COLORS, GROUP_ICONS, EXPERTISE_INFO } from '$lib/managers/expertise-icons';

	let {
		catalog,
		selected = $bindable<VersionExpertise[]>([]),
		remaining,
		budget = 0,
		discounts = new Map()
	}: {
		catalog: ShopExpertise[];
		selected: VersionExpertise[];
		remaining: number;
		budget?: number;
		discounts?: Map<number, number>;
	} = $props();

	const expertiseGroups = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- local scratch, discarded when the derivation returns
		const map = new Map<number, { id: number; name: string; color: string; expertise: ShopExpertise[] }>();
		for (const e of catalog) {
			if (!map.has(e.groupId)) {
				map.set(e.groupId, {
					id: e.groupId,
					name: e.groupName,
					color: GROUP_COLORS[e.groupId] ?? 'var(--color-accent)',
					expertise: []
				});
			}
			map.get(e.groupId)!.expertise.push(e);
		}
		return Array.from(map.values());
	});

	const budgetFill = $derived(budget > 0 ? Math.min((budget - remaining) / budget, 1) * 100 : 0);

	function getValue(id: number | null): number {
		if (id == null) return 0;
		return selected.find((s) => s.id === id)?.value ?? 0;
	}

	function setExpertiseValue(expertise: ShopExpertise, newValue: number) {
		if (expertise.id == null) return;
		if (newValue === 0) {
			selected = selected.filter((s) => s.id !== expertise.id);
		} else if (selected.some((s) => s.id === expertise.id)) {
			selected = selected.map((s) => (s.id === expertise.id ? { ...s, value: newValue } : s));
		} else {
			selected = [
				...selected,
				{
					id: expertise.id,
					name: expertise.name,
					group: expertise.groupId,
					groupName: expertise.groupName,
					value: newValue
				}
			];
		}
	}

	const iconSize = '2.5em';
</script>

{#if budget > 0}
	<div class="expertisebar" class:over={remaining < 0}>
		<div class="expertisebar-labels">
			<span class="expertisebar-label">expertise budget</span>
			<span class="expertisebar-remaining">{remaining} / {budget}</span>
		</div>
		<div class="expertisebar-track">
			<div class="expertisebar-fill" style:width="{budgetFill}%"></div>
		</div>
	</div>
{/if}

{#if catalog.length === 0}
	<p class="empty">no expertise available</p>
{:else}
	{#each expertiseGroups as group (group.id)}
		{@const groupAverage =
			group.expertise.reduce((sum, e) => sum + getValue(e.id), 0) / group.expertise.length}
		<div class="group">
			<h4 class="group-name" style="color: {group.color}">
				<Icon src={GROUP_ICONS[group.id]} color={group.color} size={iconSize} />
				{group.name}
			</h4>
			<div class="group-value">
				<ProgressBar value={groupAverage} max={100} color={group.color} name={group.name} />
			</div>
			<ul class="catalog">
				{#each group.expertise as expertise (expertise.id)}
					{@const expertiseIcon = EXPERTISE_INFO[expertise.id ?? 0]?.icon}
					{@const currentValue = getValue(expertise.id)}
					{@const expertiseCost = expertise.cost ?? 0}
					{@const expertiseDiscount = expertise.id != null ? (discounts.get(expertise.id) ?? 0) : 0}
					{@const effectiveCost = Math.max(0, expertiseCost - expertiseDiscount)}
					{@const discounted = expertiseDiscount > 0 && expertiseCost > 0}
					<li class="entry" class:owned={currentValue > 0} class:discounted>
						<div class="entry-header">
							{#if expertiseIcon}
								<Icon src={expertiseIcon} color={group.color} size={iconSize} />
							{/if}
							<div class="entry-info">
								<span class="entry-name">
									{expertise.name}
									{#if discounted}
										<span class="discount-badge" title="company discount: -{expertiseDiscount}/pt"
											>deal</span
										>
									{/if}
								</span>
								{#if expertise.description}
									<span class="entry-desc">{expertise.description}</span>
								{/if}
							</div>
						</div>
						<ExpertiseSlider
							value={currentValue}
							color={group.color}
							{remaining}
							cost={effectiveCost}
							name={expertise.name}
							max={100}
							onchange={(v) => setExpertiseValue(expertise, v)}
						/>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
{/if}

<style>
	.expertisebar {
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.expertisebar-labels {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.expertisebar-label {
		font-size: 0.95em;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.5;
	}

	.expertisebar-remaining {
		font-size: 1.05em;
		color: var(--color-accent);
	}

	.over .expertisebar-remaining {
		color: #d95c5c;
	}

	.expertisebar-track {
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		overflow: hidden;
	}

	.expertisebar-fill {
		height: 100%;
		background: var(--color-accent);
		border-radius: 3px;
		transition: width 0.2s;
	}

	.over .expertisebar-fill {
		background: #d95c5c;
	}

	.group {
		margin-bottom: 1rem;
	}

	.group-name {
		font-size: 0.92em;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		margin: 0 0 0.35rem;
		font-weight: normal;
		opacity: 0.85;
	}

	.group-value {
		margin-bottom: 1em;
	}

	.catalog {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.entry {
		padding: 0.4rem 0.6rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		transition:
			border-color 0.15s,
			background 0.15s;
	}

	.entry.owned {
		border-color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 5%, transparent);
	}

	.entry.discounted {
		border-color: color-mix(in srgb, #4caf82 45%, transparent);
	}

	.entry.discounted.owned {
		border-color: #4caf82;
		background: color-mix(in srgb, #4caf82 5%, transparent);
	}

	.discount-badge {
		display: inline-block;
		margin-left: 0.4rem;
		padding: 0.05rem 0.35rem;
		font-size: 0.7em;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #4caf82;
		border: 1px solid color-mix(in srgb, #4caf82 60%, transparent);
		vertical-align: middle;
	}

	.entry-header {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.entry-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		flex: 1;
		min-width: 0;
	}

	.entry-name {
		font-size: 1.05em;
		letter-spacing: 0.03em;
	}

	.entry-desc {
		font-size: 0.95em;
		opacity: 0.5;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.empty {
		font-size: 1em;
		opacity: 0.4;
		font-style: italic;
	}
</style>
