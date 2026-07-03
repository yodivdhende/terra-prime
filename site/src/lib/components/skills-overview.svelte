<script lang="ts">
	import type { Skill } from '$lib/db/skills.repo';
	import { groupSkills } from '$lib/utils/skills.svelte';

	let { skills, values }: { skills: Skill[]; values: { id: number; value: number }[] } = $props();

	let groupedSkills = $derived(groupSkills(skills));
	$effect(() => fillSkills(groupedSkills, values));

	function fillSkills(groups: typeof groupedSkills, values: { id: number; value: number }[]) {
		values.forEach((skill) => groups.forEach((group) => group.setValueOfSkill(skill)));
	}
</script>

<dl>
	{#each groupedSkills as group}
		<dt><h3>{group.name}: {group.total}</h3></dt>
		{#each group.skills as skill}
			<dd>* {skill.name}: {skill.value ?? 0}</dd>
		{/each}
	{/each}
</dl>

<style>
	h3 {
		font-weight: bold;
	}
</style>
