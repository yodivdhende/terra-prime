<script lang="ts">
	import { goto, invalidate } from "$app/navigation";
	import ItemForm from "$lib/components/item-form.svelte";
	import type { Item } from "$lib/db/items.repo";

    let item: Item = $state({
        id: null,
        name: '',
		description: '',
    });

   async function save(){
        const response = await fetch('/api/items', {
            method: 'put',
            body: JSON.stringify(item),
        })
        if(response.ok){
            await invalidate('/api/items');
			await goto('.');
        }
    }

</script>

<main>
	<a href=".">back</a>
	<h1>new item</h1>
	{#if item != null}
		<ItemForm bind:item={item}  />
	{/if}
	<div>
		<button onclick={save}>save</button>
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
