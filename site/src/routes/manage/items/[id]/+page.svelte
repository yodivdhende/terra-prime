<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import ItemForm from '$lib/components/item-form.svelte';
	import type { Item } from '$lib/db/items.repo';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

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
				TOAST_MANAGER.success('Item saved');
				await invalidate('/api/my/characters');
				await goto('.');
			} else {
				TOAST_MANAGER.error('Failed to save item');
			}
		} catch(err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
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
				TOAST_MANAGER.success('Item deleted');
				await goto('.');
			} else {
				TOAST_MANAGER.error('Failed to delete item');
			}
		} catch(err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
	 }
</script>

<main>
	<a href=".">back</a>
	{#if item != null}
		<ItemForm bind:item={ item } />
	{/if}
	<div>
		<button class="btn" onclick={save}>save</button>
		<button class="btn btn-danger" onclick={remove}>delete</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
	}
</style>
