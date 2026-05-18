<script lang="ts">
	import { goto } from '$app/navigation';
	import ImplantForm from '$lib/components/implant-form.svelte';
	import type { Implant } from '$lib/db/implants.repo';
	import type { PageProps } from './$types';

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
				await goto('.');
			}
		} catch( err) {
			//TODO make error component;
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
				await goto('.');
			}
		} catch( err) {
			//TODO make error component;
		}
	 }
</script>

<main>
	<a href=".">back</a>
	{#if implant != null}
		<ImplantForm bind:implant={ implant } />
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
