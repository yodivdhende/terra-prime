<script lang="ts">
	import Icon from '$lib/components/icon.svelte';
	import ProgressBar from '$lib/components/progress-bar.svelte';
	import type { ExpertiseManager } from '$lib/managers/expertise-manager.svelte';

	type ExpertiseGroupEntry = {
		id: number;
		group: number;
		groupName: string;
		name?: string;
		value: number;
		icon?: string | null;
		groupIcon?: string | null;
		groupColor?: string | null;
	};

	let {
		expertise = [],
		manager,
		size = '2em',
		showNames = false,
		showExpertiseNames = false
	}: {
		expertise?: ExpertiseGroupEntry[];
		manager?: ExpertiseManager;
		size?: string;
		/** Label each group with its name. */
		showNames?: boolean;
		/** Label each individual expertise bar with its name. */
		showExpertiseNames?: boolean;
	} = $props();

	const groups = $derived.by(() => {
		if (manager) {
			return manager.groups
				.map((g) => ({
					id: g.id,
					name: g.name,
					color: g.color ?? 'var(--color-accent)',
					icon: g.icon ?? null,
					average: g.average,
					expertise: manager.selected.filter((e) => e.group === g.id)
				}))
				.filter((g) => g.expertise.length > 0);
		}

		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- local scratch, discarded when the derivation returns
		const map = new Map<
			number,
			{
				id: number;
				name: string;
				color: string;
				icon: string | null;
				expertise: ExpertiseGroupEntry[];
				total: number;
				count: number;
			}
		>();

		for (const entry of expertise) {
			if (!map.has(entry.group)) {
				map.set(entry.group, {
					id: entry.group,
					name: entry.groupName,
					color: entry.groupColor ?? 'var(--color-accent)',
					icon: entry.groupIcon ?? null,
					expertise: [],
					total: 0,
					count: 0
				});
			}
			const group = map.get(entry.group)!;
			group.expertise.push(entry);
			group.total += entry.value;
			group.count += 1;
		}
		return Array.from(map.values()).map((group) => ({
			...group,
			average: group.count > 0 ? group.total / group.count : 0
		}));
	});
</script>

<div class="expertise-groups">
	{#each groups as group (group.id)}
		<div class="expertise group">
			{#if group.icon}
				<div class="expertise-icon">
					<Icon src={group.icon} color={group.color} tooltip={group.name} {size} />
				</div>
			{/if}
			{#if showNames}
				<div class="expertise-name">
					<span style="color: var(--expertise-group-name-color, {group.color})">{group.name}</span>
				</div>
			{/if}
			<div class="expertise-bar bar">
				<ProgressBar value={group.average} color={group.color} name={group.name} />
			</div>
		</div>
		{#each group.expertise as entry (entry.id)}
			<div class="expertise">
				{#if entry.icon}
					<div class="expertise-icon">
						<Icon src={entry.icon} color={group.color} tooltip={entry.name} {size} />
					</div>
				{/if}
				{#if showExpertiseNames}
					<div class="expertise-name">{entry.name}</div>
				{/if}
				<div class="expertise-bar bar">
					<ProgressBar value={entry.value} color={group.color} name={entry.name} />
				</div>
			</div>
		{/each}
	{/each}
</div>

<style>
	/* Always fills its container; callers scope the width they want. */
	.expertise-groups {
		display: flex;
		flex-wrap: nowrap;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
	}

	.expertise {
		display: grid;
		grid-template:
			'icon name' 1em
			'icon bar' min-content
			/ min-content 1fr;
		align-items: center;
		column-gap: 0.25rem;
	}

	.group .expertise-icon {
		margin: 0;
		margin-right: 1em;
	}

	.expertise-icon {
		grid-area: icon;
		margin-left: 1em;
	}
	.expertise-name {
		grid-area: name;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.8;
		white-space: nowrap;
	}
	.expertise-bar {
		grid-area: bar;
	}

	.bar {
		width: 100%;
	}
</style>
