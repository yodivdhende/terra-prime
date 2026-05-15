<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import ItemForm from '$lib/components/item-form.svelte';
	import type { Item } from '$lib/db/items.repo';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let item: Item | null = $state(null);
	$effect(()=> {
		const {item:loaditem} = data;
		item = loaditem;
	})

	async function save() {
		const itemToSave = $state.snapshot(item);
		if(itemToSave == null) return;
		const {id: itemId} = itemToSave;
		if(itemId == null) return;
		try {
			const result = await fetch(`/api/items/${itemId}`, {
				method: 'post',
				body: JSON.stringify(itemToSave),
				headers: {
					'content-type': 'application/json',
				}
			})
			if(result.ok) {
				await invalidate('/api/my/characters');
				await goto('.');
			}
		} catch( err) {
			//TODO make error component;
		}
    }

	async function remove() {
		const itemToSave = $state.snapshot(item);
		if(itemToSave == null) return;
		const {id: itemId} = itemToSave;
		if(itemId == null) return;
		try {
			const result = await fetch(`/api/items/${itemId}`, {
				method: 'delete',
				headers: {
					'content-type': 'application/json',
				}
			})
			if(result.ok) {
				await goto('.');
			}
		} catch( err) {
			//TODO make error component;
		}
	 }
</script>

<main>
	<a href=".">back</a>
	{#if item != null}
		<ItemForm bind:item={ item } />
	{/if}
	<div>
		<button onclick={save}>save</button>
		<button onclick={remove}>delete</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
		background-color: white;
	}
</style>
