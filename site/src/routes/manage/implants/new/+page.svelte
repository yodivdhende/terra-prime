<script lang="ts">
	import { goto, invalidate } from "$app/navigation";
	import ImplantForm from "$lib/components/implant-form.svelte";
	import type { Implant } from "$lib/db/implants.repo";
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

    let implant: Implant = $state({
        id: null,
        name: '',
		description: '',
		prerequisite: null,
    });

   async function save(){
		try {
			const response = await fetch('/api/implants', {
				method: 'put',
				body: JSON.stringify(implant),
			});
			if(response.ok){
				TOAST_MANAGER.success('Implant saved');
				await invalidate('/api/implants');
				await goto('.');
			} else {
				TOAST_MANAGER.error('Failed to save implant');
			}
		} catch(err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
    }

</script>

<main>
	<a href=".">back</a>
	<h1>new implant</h1>
	{#if implant != null}
		<ImplantForm bind:implant={implant} allImplants={data.allImplants ?? []} />
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
