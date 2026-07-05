<script lang="ts">
	import Icon from '$lib/codex/components/icon.svelte';
	import ProgressBar from '$lib/codex/components/progress-bar.svelte';
	import { GROUP_COLORS, GROUP_ICONS } from '$lib/codex/managers/skill-icons';

	let { skills, size = '1em' }: { skills: CharacterVerionSkill[]; size?: string } = $props();

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
</script>

<div class="skill-groups">
	{#each groups as group (group.id)}
		{@const icon = GROUP_ICONS[group.id]}
		<div class="group">
			{#if icon}
				<Icon src={icon} color={group.color} tooltip={group.name} {size} />
			{/if}
			<div class="bar">
				<ProgressBar value={group.average} color={group.color} name={group.name} />
			</div>
		</div>
	{/each}
</div>

<style>
	.skill-groups {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.group {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.bar {
		width: 4rem;
	}
</style>
