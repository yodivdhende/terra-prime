<script lang="ts">
	import type { Implant } from "$lib/db/implants.repo";

	let {
		implant = $bindable<Implant>(),
	}: { implant: Implant } = $props();
</script>

<main>
	<label for="name">name</label>
	<input id="name" type="text" bind:value={implant.name} />
	<label for="description">description</label>
	<input type="textarea" bind:value={implant.description} />
	<label for="cost">cost</label>
	<input id="cost" type="number" min="0" bind:value={implant.cost} />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
