<script lang="ts">
	import type { Skill, SkillGroup } from '$lib/db/skills.repo';

	let { skill = $bindable<Skill>(), groups }: { skill: Skill; groups: SkillGroup[] } = $props();
</script>

<main>
	<label for="name">name</label>
	<input id="name" type="text" bind:value={skill.name} />
	<select id="group" bind:value={skill.groupId}>
		{#each groups as group}
			<option value={group.id}>{group.name}</option>
		{/each}
	</select>
	<label for="description">description</label>
	<input type="textarea" bind:value={skill.description} />
	<label for="cost">cost</label>
	<input id="cost" type="number" min="0" bind:value={skill.cost} />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
