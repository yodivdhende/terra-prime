<script lang="ts">
	import type { Expertise, ExpertiseGroup } from '$lib/db/expertise.repo';

	let { expertise = $bindable<Expertise>(), groups }: { expertise: Expertise; groups: ExpertiseGroup[] } = $props();
</script>

<main>
	<label for="name">name</label>
	<input id="name" type="text" bind:value={expertise.name} />
	<select id="group" bind:value={expertise.groupId}>
		{#each groups as group (group.id)}
			<option value={group.id}>{group.name}</option>
		{/each}
	</select>
	<label for="description">description</label>
	<input type="textarea" bind:value={expertise.description} />
	<label for="cost">cost</label>
	<input id="cost" type="number" min="0" bind:value={expertise.cost} />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
