<script lang="ts">
	import type { Expertise, ExpertiseGroup } from '$lib/db/expertise.repo';
	import IconPicker from '$lib/components/icon-picker.svelte';

	let {
		expertise = $bindable<Expertise>(),
		groups
	}: { expertise: Expertise; groups: ExpertiseGroup[] } = $props();
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
	<span>icon</span>
	<IconPicker bind:value={expertise.icon} />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
