<script lang="ts">
	import Icon from '$lib/codex/components/icon.svelte';
	import ProgressBar from '$lib/codex/components/progress-bar.svelte';
	import { GROUP_COLORS, GROUP_ICONS, SKILL_INFO } from '$lib/codex/managers/skill-icons';

	let { skills, size = '1em' }: { skills: CharacterVerionSkill[]; size?: string } = $props();

	const groups = $derived.by(() => {
		const map = new Map<
			number,
			{
				id: number;
				name: string;
				color: string;
				skills: CharacterVerionSkill[];
				total: number;
				count: number;
			}
		>();
		for (const skill of skills) {
			if (!map.has(skill.group)) {
				map.set(skill.group, {
					id: skill.group,
					name: skill.groupName,
					color: GROUP_COLORS[skill.group] ?? 'var(--color-accent)',
					skills: [],
					total: 0,
					count: 0
				});
			}
			const group = map.get(skill.group)!;
			group.skills.push(skill);
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
			<div class="skills">
				{#each group.skills as skill (skill.id)}
					{@const skillIcon = SKILL_INFO[skill.id]?.icon}
					<div class="skill">
						{#if skillIcon}
							<Icon src={skillIcon} color={group.color} tooltip={skill.name} {size} />
						{/if}
						<div class="bar">
							<ProgressBar value={skill.value} color={group.color} name={skill.name} />
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.skill-groups {
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

	.skills {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding-left: 1rem;
	}

	.skill {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.bar {
		width: 100%;
	}
</style>
