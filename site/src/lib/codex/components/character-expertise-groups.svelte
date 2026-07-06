<script lang="ts">
	import Icon from '$lib/codex/components/icon.svelte';
	import ProgressBar from '$lib/codex/components/progress-bar.svelte';
	import { GROUP_COLORS, GROUP_ICONS, EXPERTISE_INFO } from '$lib/codex/managers/expertise-icons';
	import type { ExpertiseManager } from '$lib/codex/managers/expertise-manager.svelte';

	type ExpertiseGroupEntry = { id: number; group: number; groupName: string; name?: string; value: number };

	let {
		expertise = [],
		manager,
		size = '1em'
	}: { expertise?: ExpertiseGroupEntry[]; manager?: ExpertiseManager; size?: string } = $props();

	const groups = $derived.by(() => {
		if (manager) {
			return manager.groups
				.map((g) => ({
					id: g.id,
					name: g.name,
					color: GROUP_COLORS[g.id] ?? 'var(--color-accent)',
					average: g.average,
					expertise: manager.selected.filter((e) => e.group === g.id)
				}))
				.filter((g) => g.expertise.length > 0);
		}

		const map = new Map<
			number,
			{
				id: number;
				name: string;
				color: string;
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
					color: GROUP_COLORS[entry.group] ?? 'var(--color-accent)',
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
		{@const groupIcon = GROUP_ICONS[group.id]}
		<div class="group">
			<div class="group-header">
				{#if groupIcon}
					<Icon src={groupIcon} color={group.color} tooltip={group.name} {size} />
				{/if}
				<div class="bar">
					<ProgressBar value={group.average} color={group.color} name={group.name} />
				</div>
			</div>
			<div class="expertise">
				{#each group.expertise as entry (entry.id)}
					{@const entryIcon = EXPERTISE_INFO[entry.id]?.icon}
					<div class="entry">
						{#if entryIcon}
							<Icon src={entryIcon} color={group.color} tooltip={entry.name} {size} />
						{/if}
						<div class="bar">
							<ProgressBar value={entry.value} color={group.color} name={entry.name} />
						</div>
					</div>
				{/each}
			</div>
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
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.group-header {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.expertise {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding-left: 1rem;
	}

	.entry {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.bar {
		width: 100%;
	}
</style>
