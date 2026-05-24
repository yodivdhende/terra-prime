<script lang="ts">
	import { CircleMinus, PlusCircle } from '@lucide/svelte';
	import type { Item } from '$lib/db/items.repo';
	import type { CharacterVersionItem } from '$lib/db/character_version.repo';
	import { getEventCharacterVersionManager } from '$lib/managers/event-character-version-manager.svelte';

	let { items }: { items: Item[] } = $props();
	let characterManager = getEventCharacterVersionManager();
	let basketItems: (Item & { count: number })[] = $state([]);
	let newCharacterItems: CharacterVersionItem[] = $derived(
		basketItems
			.map((item) => {
				if (item.id == null) return null;
				if (item.count <= 0) return null;
				return { id: item.id, count: item.count };
			})
			.filter((item) => item != null)
	);

	$effect(() => {
		if (items) {
			basketItems = items.map((item) => ({ ...item, count: 0 }));
		}
	});

	$effect(() => {
		characterManager.items = newCharacterItems;
	});

	function remove(item: { count: number }) {
		if (item.count === 0) return;
		item.count--;
	}
</script>

<main>
	<h1>Items shop</h1>
	<div class="grid">
		{#each basketItems as item}
			<div class="items {item.count > 0 ? 'selected' : ''}">
				<img src="https://picsum.photos/200/200" alt="random" />
				<div class="item-name">{item.name}</div>
				<div class="item-description">{item.description}</div>
				<button onclick={() => remove(item)}><CircleMinus /></button>
				<input type="number" bind:value={item.count} />
				<button onclick={() => item.count++}><PlusCircle /></button>
			</div>
		{/each}
	</div>
</main>

<style>
	h1 {
		font-size: 1.5em;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
	}

	.items {
		display: grid;
		width: 250px;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: min-content;
		grid-template-areas:
			'image        image       image'
			'name         name        name'
			'description  description description'
			'remove       value       add';
	}

	.selected {
		background-color: lightgreen;
	}

	.items img {
		grid-area: image;
		margin-left: auto;
		margin-right: auto;
	}

	.items .item-name {
		grid-area: name;
		width: 100%;
		height: min-content;
		padding: 0.5em;
		text-align: center;
		font-weight: bold;
		border-bottom: 1px solid silver;
	}

	.items .item-description {
		grid-area: description;
		width: 100%;
		padding: 0.5em;
	}

	.items button:last-child {
		grid-area: add;
	}

	.items input {
		grid-area: value;
		width: 100%;
		text-align: center;
	}

	.items button:first-child {
		grid-area: remove;
	}
</style>
