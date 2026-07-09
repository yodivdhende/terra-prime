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
		showNames = false
	}: {
		expertise?: ExpertiseGroupEntry[];
		manager?: ExpertiseManager;
		size?: string;
		showNames?: boolean;
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
		<div class="group">
			{#if group.icon}
				<div class="group-icon">
					<Icon src={group.icon} color={group.color} tooltip={group.name} {size} />
				</div>
			{/if}
			{#if showNames}
				<div class="group-name">
					<span style="color: {group.color}">{group.name}</span>
				</div>
			{/if}
			<div class="group-bar bar">
				<ProgressBar value={group.average} color={group.color} name={group.name} />
			</div>
		</div>
		<div class="expertise">
			{#each group.expertise as entry (entry.id)}
				<div class="entry">
					{#if entry.icon}
						<div class="entry-icon">
							<Icon src={entry.icon} color={group.color} tooltip={entry.name} {size} />
						</div>
					{/if}
					<!-- {#if showNames} -->
					<div class="entry-name">
						{entry.name}
					</div>
					<!-- {/if} -->
					<div class="entry-bar bar">
						<ProgressBar value={entry.value} color={group.color} name={entry.name} />
					</div>
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.expertise-groups {
		display: flex;
		flex-wrap: nowrap;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		max-width: 200px;
		font: 1.5em;
	}

	.group {
		display: grid;
		grid-template:
			'icon name' 1em
			'icon bar' min-content
			/ min-content 1fr;
		align-items: center;
		column-gap: 0.25rem;
	}

	.group-icon {
		grid-area: icon;
	}
	.group-name {
		grid-area: name;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.8;
		white-space: nowrap;
	}
	.group-bar {
		grid-area: bar;
	}

	.expertise {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding-left: 1rem;
	}

	.entry {
		display: grid;
		grid-template:
			'icon name' 0.7em
			'icon bar' min-content
			/ min-content 1fr;
		align-items: center;
		gap: 0.25rem;
	}

	.bar {
		width: 100%;
	}

	.entry-icon {
		grid-area: icon;
	}

	.entry-name {
		grid-area: name;
		font-size: 0.7em;
		opacity: 0.8;
		white-space: nowrap;
		overflow: hidden;
	}

	.entry-bar {
		grid-area: bar;
	}
</style>
