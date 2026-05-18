<script lang="ts">
	import { goto, invalidate } from "$app/navigation";
	import ImplantForm from "$lib/components/implant-form.svelte";
	import type { Implant } from "$lib/db/implants.repo";

    let implant: Implant = $state({
        id: null,
        name: '',
		description: '',
    });

   async function save(){
        const response = await fetch('/api/implants', {
            method: 'put',
            body: JSON.stringify(implant),
        })
        if(response.ok){
            await invalidate('/api/implants');
			await goto('.');
        }
    }

</script>

<main>
	<a href=".">back</a>
	<h1>new implant</h1>
	{#if implant != null}
		<ImplantForm bind:implant={implant}  />
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
