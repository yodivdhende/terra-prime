<script lang="ts">
	import { goto, invalidate } from "$app/navigation";
	import { resolve } from "$app/paths";
	import ItemForm from "$lib/components/item-form.svelte";
	import type { Item } from "$lib/db/items.repo";
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

    let item: Item = $state({
        id: null,
        name: '',
		description: '',
    });

   async function save(){
		try {
			const response = await fetch('/api/items', {
				method: 'put',
				body: JSON.stringify(item),
			});
			if(response.ok){
				TOAST_MANAGER.success('Item saved');
				await invalidate('/api/items');
				await goto(resolve('/manage/items'));
			} else {
				TOAST_MANAGER.error('Failed to save item');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
    }

</script>

<main>
	<a href={resolve('/manage/items')}>back</a>
	<h1>new item</h1>
	{#if item != null}
		<ItemForm bind:item={item}  />
	{/if}
	<div>
		<button class="btn" onclick={save}>save</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
	}
</style>
