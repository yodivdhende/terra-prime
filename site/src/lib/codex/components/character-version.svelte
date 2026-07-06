<script lang="ts" module>
	export type CharacterVersionExpertise = {
		id: number;
		name: string;
		group: number;
		groupName: string;
		value: number;
	};

	export type CharacterVersionItem = {
		id: number;
		name: string;
		description?: string;
	};

	export type CharacterVersionImplant = {
		id: number;
		name: string;
		description?: string;
		slot?: number;
	};
</script>

<script lang="ts">
	import Icon from './icon.svelte';
	import ProgressBar from './progress-bar.svelte';
	import { GROUP_COLORS, getExpertiseIcon } from '$lib/codex/managers/expertise-icons';

	let {
		characterName,
		versionName,
		companyName,
		expertise = [],
		items = [],
		implants = []
	}: {
		characterName: string;
		versionName?: string;
		companyName?: string | null;
		expertise?: CharacterVersionExpertise[];
		items?: CharacterVersionItem[];
		implants?: CharacterVersionImplant[];
	} = $props();

	const expertiseGroups = $derived.by(() => {
		const map = new Map<
			number,
			{ id: number; name: string; color: string; expertise: CharacterVersionExpertise[] }
		>();
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

<div class="character-version">
	<div class="header">
		<span class="character-name">{characterName}</span>
		{#if versionName}
			<span class="version-name">{versionName}</span>
		{/if}
		{#if companyName}
			<span class="company-name">{companyName}</span>
		{/if}
	</div>

	{#if expertise.length > 0}
		<section class="section">
			<h4 class="section-label">expertise</h4>
			<div class="expertise-groups">
				{#each expertiseGroups as group (group.id)}
					<div class="group">
						<span class="group-name" style="color: {group.color}">{group.name}</span>
						<ul class="expertise-list">
							{#each group.expertise as entry (entry.id)}
								{@const icon = getExpertiseIcon(entry.name)}
								<li class="expertise">
									{#if icon}
										<Icon src={icon} color={group.color} size="2rem" />
									{/if}
									<span class="expertise-name">{entry.name}</span>
									<div class="expertise-bar">
										<ProgressBar value={entry.value} color={group.color} name={entry.name} />
									</div>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	{#if items.length > 0}
		<section class="section">
			<h4 class="section-label">items</h4>
			<ul class="entry-list">
				{#each items as item (item.id)}
					<li class="entry">
						<span class="entry-name">{item.name}</span>
						{#if item.description}
							<span class="entry-desc">{item.description}</span>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if implants.length > 0}
		<section class="section">
			<h4 class="section-label">implants</h4>
			<ul class="entry-list">
				{#each implants as implant (implant.slot ?? implant.id)}
					<li class="entry">
						<span class="entry-name">{implant.name}</span>
						{#if implant.description}
							<span class="entry-desc">{implant.description}</span>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<style>
	.character-version {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.header {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.character-name {
		font-size: 1em;
		letter-spacing: 0.04em;
	}

	.version-name {
		font-size: 0.65em;
		opacity: 0.45;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.company-name {
		font-size: 0.65em;
		color: var(--color-accent);
		opacity: 0.7;
		letter-spacing: 0.05em;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.section-label {
		font-size: 0.6em;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		opacity: 0.4;
		margin: 0;
		font-weight: normal;
	}

	.expertise-groups {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		border-left: 2px solid currentColor;
		padding-left: 0.5rem;
	}

	.group-name {
		font-size: 0.6em;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.8;
	}

	.expertise-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.expertise {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.expertise-name {
		flex: 1;
		font-size: 0.7em;
		opacity: 0.8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}

	.expertise-bar {
		flex-shrink: 0;
		width: 7rem;
	}

	.entry-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.entry {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.35rem 0.5rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
	}

	.entry-name {
		font-size: 0.75em;
		letter-spacing: 0.03em;
	}

	.entry-desc {
		font-size: 0.62em;
		opacity: 0.45;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
</style>
