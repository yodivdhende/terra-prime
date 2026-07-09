<script lang="ts">
	import Icon from '$lib/components/icon.svelte';
	import ProgressBar from '$lib/components/progress-bar.svelte';
	import { GROUP_COLORS, EXPERTISE_INFO } from '$lib/managers/expertise-icons';

	type ExpertiseEntry = {
		id: number;
		group: number;
		groupName: string;
		value: number;
	};

	let { expertise }: { expertise: ExpertiseEntry[] } = $props();

	const groups = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- local scratch, discarded when the derivation returns
		const map = new Map<number, { id: number; name: string; color: string; expertise: ExpertiseEntry[] }>();
		for (const entry of expertise) {
			if (!map.has(entry.group)) {
				map.set(entry.group, {
					id: entry.group,
					name: entry.groupName,
					color: GROUP_COLORS[entry.group] ?? 'var(--color-accent)',
					expertise: []
				});
			}
			map.get(entry.group)!.expertise.push(entry);
		}
		return Array.from(map.values());
	});
</script>

<div class="character-expertise">
	{#each groups as group (group.id)}
		<div class="group" style="--group-color: {group.color}; border-left-color: {group.color}">
			<div class="group-header">
				<span class="group-name">{group.name}</span>
			</div>
			<ul class="expertise-list">
				{#each group.expertise as entry (entry.id)}
					{@const info = EXPERTISE_INFO[entry.id]}
					<li class="expertise">
						{#if info}
							<Icon src={info.icon} color={group.color} tooltip={info.name} size="1.1rem" />
							<span class="expertise-name">{info.name}</span>
						{:else}
							<span class="expertise-name expertise-name--unknown">expertise #{entry.id}</span>
						{/if}
						<div class="expertise-value">
							<ProgressBar
								value={entry.value}
								color={group.color}
								name={info?.name ?? `expertise #${entry.id}`}
							/>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</div>

<style>
	.character-expertise {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.group {
		border-left: 2px solid;
		padding-left: 0.6rem;
	}

	.group-header {
		margin-bottom: 0.35rem;
	}

	.group-name {
		font-size: 0.65em;
		font-weight: bold;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--group-color);
		opacity: 0.85;
	}

	.expertise-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.expertise {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}

	.expertise-name {
		flex: 1;
		font-size: 0.7em;
		opacity: 0.8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.expertise-name--unknown {
		opacity: 0.35;
		font-style: italic;
	}

	.expertise-value {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		flex-shrink: 0;
		width: 5rem;
	}
</style>
