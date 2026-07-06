<script lang="ts">
	import Icon from '$lib/codex/components/icon.svelte';
	import ProgressBar from '$lib/codex/components/progress-bar.svelte';
	import { GROUP_COLORS, GROUP_ICONS } from '$lib/codex/managers/skill-icons';
	import type {
		VersionImplant,
		VersionItem,
		VersionSkill
	} from '$lib/codex/managers/character-manager.svelte';
	import itemLogo from '$lib/assets/images/ItemLogo.svg?raw';
	import implantLogo from '$lib/assets/images/ImplantLogo.svg?raw';

	let {
		skills,
		items,
		implants,
		size = '1.2em'
	}: {
		skills: VersionSkill[];
		items: VersionItem[];
		implants: VersionImplant[];
		size?: string;
	} = $props();

	const groups = $derived.by(() => {
		const map = new Map<
			number,
			{ id: number; name: string; color: string; total: number; count: number }
		>();
		for (const skill of skills) {
			if (!map.has(skill.group)) {
				map.set(skill.group, {
					id: skill.group,
					name: skill.groupName,
					color: GROUP_COLORS[skill.group] ?? 'var(--color-accent)',
					total: 0,
					count: 0
				});
			}
			const group = map.get(skill.group)!;
			group.total += skill.value;
			group.count += 1;
		}
		return Array.from(map.values()).map((group) => ({
			...group,
			average: group.count > 0 ? group.total / group.count : 0
		}));
	});

	const itemCount = $derived(items.reduce((sum, i) => sum + i.count, 0));
</script>

<div class="preview">
	<div class="groups">
		{#each groups as group (group.id)}
			{@const groupIcon = GROUP_ICONS[group.id]}
			<div class="group">
				{#if groupIcon}
					<Icon src={groupIcon} color={group.color} tooltip={group.name} {size} />
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

<style>
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
