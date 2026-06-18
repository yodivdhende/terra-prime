<script lang="ts">
	import type { Implant } from "$lib/db/implants.repo";

	let {
		implant = $bindable<Implant>(),
		allImplants = []
	}: { implant: Implant; allImplants?: Implant[] } = $props();
</script>

<main>
	<label for="name">name</label>
	<input id="name" type="text" bind:value={implant.name} />
	<label for="description">description</label>
	<input type="textarea" bind:value={implant.description} />
	<label for="prerequisite">prerequisite</label>
	<select
		id="prerequisite"
		value={implant.prerequisite ?? ''}
		onchange={(e) => {
			const val = (e.target as HTMLSelectElement).value;
			implant.prerequisite = val === '' ? null : Number(val);
		}}
	>
		<option value="">none</option>
		{#each allImplants.filter((i) => i.id !== implant.id) as option (option.id)}
			<option value={option.id}>{option.name}</option>
		{/each}
	</select>
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
