<script lang="ts">
	import type { Implant } from '$lib/db/implants.repo';
	import { getEventCharacterVersionManager } from '$lib/managers/event-character-version-manager.svelte';
	import { PlusCircle, Trash } from '@lucide/svelte';

	let { implants }: { implants: Implant[] } = $props();
	let characterManager = getEventCharacterVersionManager();
	let implantItems: (Implant & { selected: boolean })[] = $derived.by(() =>
		implants.map((implant) => ({
			...implant,
			selected: characterManager.implants.some((i) => i.id === (implant.id ?? -1))
		}))
	);

	let nextSlot = $derived(
		characterManager.implants.length > 0
			? Math.max(...characterManager.implants.map((i) => i.slot)) + 1
			: 1
	);

	function addImplant(id: number | null) {
		if (id == null) return;
		characterManager.implants = [...characterManager.implants, { id, slot: nextSlot }];
	}
	function removeImplant(id: number | null) {
		if (id == null) return;
		characterManager.implants = characterManager.implants.filter((i) => i.id !== id);
	}
</script>

<main>
	<h1>Implants shop</h1>
	<div class="grid">
		{#each implantItems as implant (implant.id)}
			<div class="implant {implant.selected ? 'selected' : ''}">
				<img src="https://picsum.photos/200/200" alt="random" />
				<div class="implant-name">{implant.name}</div>
				<div class="implant-description">{implant.description}</div>
				<button onclick={() => removeImplant(implant.id)}><Trash /></button>
				<button onclick={() => addImplant(implant.id)}><PlusCircle /></button>
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

	.implant {
		display: grid;
		max-width: 250px;
		grid-template-areas:
			'image        image'
			'name         name'
			'description  description'
			'delete       add';
	}

	.selected {
		background-color: lightgreen;
	}

	.implant img {
		grid-area: image;
		margin-left: auto;
		margin-right: auto;
	}

	.implant .implant-name {
		grid-area: name;
		width: 100%;
		height: min-content;
		padding: 0.5em;
		text-align: center;
		font-weight: bold;
		border-bottom: 1px solid silver;
	}
	.implant .implant-description {
		grid-area: description;
		width: 100%;
		padding: 0.5em;
	}
	.implant button:first {
		grid-area: delete;
	}
	.implant button:last-child {
		grid-area: add;
	}
</style>
