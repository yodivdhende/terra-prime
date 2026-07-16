<script lang="ts">
	import Icon from '$lib/components/icon.svelte';
	import ProgressBar from '$lib/components/progress-bar.svelte';
	import type {
		VersionImplant,
		VersionItem,
		VersionExpertise
	} from '$lib/managers/character-manager.svelte';
	import itemLogo from '$lib/assets/images/ItemLogo.svg?raw';
	import implantLogo from '$lib/assets/images/ImplantLogo.svg?raw';

	let {
		characterName,
		versionName,
		companyName,
		ownerName,
		expertise,
		items,
		implants,
		size = '1.2em'
	}: {
		characterName?: string;
		versionName?: string;
		companyName?: string | null;
		ownerName?: string;
		expertise: VersionExpertise[];
		items: VersionItem[];
		implants: VersionImplant[];
		size?: string;
	} = $props();

	const groups = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- local scratch, discarded when the derivation returns
		const map = new Map<
			number,
			{ id: number; name: string; color: string; icon: string | null; total: number; count: number }
		>();
		for (const entry of expertise) {
			if (!map.has(entry.group)) {
				map.set(entry.group, {
					id: entry.group,
					name: entry.groupName,
					color: entry.groupColor ?? 'var(--color-accent)',
					icon: entry.groupIcon ?? null,
					total: 0,
					count: 0
				});
			}
			const group = map.get(entry.group)!;
			group.total += entry.value;
			group.count += 1;
		}
		return Array.from(map.values()).map((group) => ({
			...group,
			average: group.count > 0 ? group.total / group.count : 0
		}));
	});

	const itemCount = $derived(items.reduce((sum, i) => sum + i.count, 0));
</script>

<div class="character-preview">
	{#if characterName}
		<div class="header">
			<span class="character-name">{characterName}</span>
			{#if versionName}
				<span class="version-name">{versionName}</span>
			{/if}
			{#if companyName}
				<span class="company-name">{companyName}</span>
			{/if}
			{#if ownerName}
				<span class="owner-name">played by {ownerName}</span>
			{/if}
		</div>
	{/if}
	<div class="preview">
		<div class="groups">
			{#each groups as group (group.id)}
				<div class="group">
					{#if group.icon}
						<Icon src={group.icon} color={group.color} tooltip={group.name} {size} />
					{/if}
					<div class="bar">
						<ProgressBar value={group.average} color={group.color} name={group.name} />
					</div>
				</div>
			{/each}
		</div>
		<div class="counts">
			<span class="count">
				<Icon src={itemLogo} color="var(--color-accent)" tooltip="Items" {size} />
				{itemCount}
			</span>
			<span class="count">
				<Icon src={implantLogo} color="var(--color-accent)" tooltip="Implants" {size} />
				{implants.length}
			</span>
		</div>
	</div>
</div>

<style>
	.character-preview {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
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

	.owner-name {
		font-size: 0.65em;
		opacity: 0.45;
		letter-spacing: 0.05em;
	}

	.preview {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
	}

	.groups {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		flex: 1;
		min-width: 160px;
	}

	.group {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.bar {
		width: 100%;
	}

	.counts {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.count {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.9rem;
	}
</style>
