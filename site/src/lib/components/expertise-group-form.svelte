<script lang="ts">
	import type { ExpertiseGroup } from '$lib/db/expertise.repo';

	let { group = $bindable<ExpertiseGroup>() }: { group: ExpertiseGroup } = $props();
</script>

<main>
	<label for="name">name</label>
	<input id="name" type="text" bind:value={group.name} />
	<label for="description">description</label>
	<input type="textarea" bind:value={group.description} />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
