<script lang="ts">
	import { goto } from '$app/navigation';
	import ImplantForm from '$lib/components/implant-form.svelte';
	import type { Implant } from '$lib/db/implants.repo';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();
	let implant: Implant | null = $state(null);
	$effect(()=> {
		const {implant:loadimplant} = data;
		implant = loadimplant;
	})

	async function save() {
		const implantToSave = $state.snapshot(implant);
		if(implantToSave == null) return;
		const {id: implantId} = implantToSave;
		if(implantId == null) return;
		try {
			const result = await fetch(`/api/implants/${implantId}`, {
				method: 'post',
				body: JSON.stringify(implantToSave),
				headers: {
					'content-type': 'application/json',
				}
			})
			if(result.ok) {
				TOAST_MANAGER.success('Implant saved');
				await goto('.');
			} else {
				TOAST_MANAGER.error('Failed to save implant');
			}
		} catch(err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
    }

	async function remove() {
		const implantToSave = $state.snapshot(implant);
		if(implantToSave == null) return;
		const {id: implantId} = implantToSave;
		if(implantId == null) return;
		try {
			const result = await fetch(`/api/implants/${implantId}`, {
				method: 'delete',
				headers: {
					'content-type': 'application/json',
				}
			})
			if(result.ok) {
				TOAST_MANAGER.success('Implant deleted');
				await goto('.');
			} else {
				TOAST_MANAGER.error('Failed to delete implant');
			}
		} catch(err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
	 }
</script>

<main>
	<a href=".">back</a>
	{#if implant != null}
		<ImplantForm bind:implant={implant} allImplants={data.allImplants ?? []} />
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
