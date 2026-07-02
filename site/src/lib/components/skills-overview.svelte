<script lang="ts">
	import type { Skill } from '$lib/db/skills.repo';
	import { groupSkills } from '$lib/utils/skills.svelte';
	import ProgressBar from '$lib/codex/components/progress-bar.svelte';

	let { skills, values }: { skills: Skill[]; values: { id: number; value: number }[] } = $props();

	let groupedSkills = $derived(groupSkills(skills));
	$effect(() => fillSkills(groupedSkills, values));

	function fillSkills(groups: typeof groupedSkills, values: { id: number; value: number }[]) {
		values.forEach((skill) => groups.forEach((group) => group.setValueOfSkill(skill)));
	}
</script>

<dl>
	{#each groupedSkills as group}
		<dt>
			<h3>{group.name}</h3>
			<ProgressBar value={group.average} color="var(--color-accent)" name={group.name} />
		</dt>
		{#each group.skills as skill}
			<dd>
				<span class="skill-name">* {skill.name}</span>
				<ProgressBar value={skill.value ?? 0} color="var(--color-accent)" name={skill.name} />
			</dd>
		{/each}
	{/each}
</dl>

<style>
	h3 {
		font-weight: bold;
	}

	dd {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.skill-name {
		flex-shrink: 0;
	}
</style>
