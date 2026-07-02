<script lang="ts">
	import EngineeringIcon from '$lib/assets/images/SkillLogo-Engineering.svg?raw';
	import LifeSciencesIcon from '$lib/assets/images/SkillLogo-LifeSciences.svg?raw';
	import InformationTechnologyIcon from '$lib/assets/images/SkillLogo-InformationTechnology.svg?raw';
	import SocialeWetenschapIcon from '$lib/assets/images/SkillLogo-SocialeWetenschap.svg?raw';
	import Icon from '$lib/codex/components/icon.svelte';
	import ProgressBar from '$lib/codex/components/progress-bar.svelte';

	let { skills, size = '1em' }: { skills: CharacterVerionSkill[]; size?: string } = $props();

	const GROUP_ICON: Record<number, string> = {
		1: EngineeringIcon,
		2: LifeSciencesIcon,
		3: InformationTechnologyIcon,
		4: SocialeWetenschapIcon
	};

	const GROUP_COLOR: Record<number, string> = {
		1: '#f0c040',
		2: '#4caf82',
		3: '#4a9edd',
		4: '#d95c5c'
	};

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
					color: GROUP_COLOR[skill.group] ?? 'var(--color-accent)',
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
		{@const icon = GROUP_ICON[group.id]}
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
