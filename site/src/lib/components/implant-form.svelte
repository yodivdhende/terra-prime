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
	<label for="max-charges">max charges</label>
	<input id="max-charges" type="number" min="0" step="1" bind:value={implant.maxCharges} />
	<small>0 for an implant that is not activated at all. Recharging is an admin action.</small>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	small {
		font-size: 0.75rem;
		opacity: 0.6;
	}
</style>
