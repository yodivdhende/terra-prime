<script lang="ts">
	import { type Item } from "$lib/db/items.repo";

	let { item = $bindable<Item>() }: { item: Item} = $props();
</script>

<main>
	<label for="name">name</label>
	<input id="name" type="text" bind:value={item.name} />
	<label for="description">description</label>
	<input type="textarea" bind:value={item.description} />
	<label for="cost">cost</label>
	<input id="cost" type="number" min="0" bind:value={item.cost} />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
