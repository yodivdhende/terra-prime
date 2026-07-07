<script lang="ts">
	import { goto } from '$app/navigation';
	import ImplantForm from '$lib/components/implant-form.svelte';
	import CharacterAccessSelect from '$lib/components/character-access-select.svelte';
	import type { Implant } from '$lib/db/implants.repo';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();
	let implant: Implant | null = $state(null);
	$effect(()=> {
		const {implant:loadimplant} = data;
		implant = loadimplant ?? null;
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
		<ImplantForm bind:implant={implant} />

		<fieldset>
			<legend>Character Access</legend>
			<label>
				<input type="radio" bind:group={implant.characterAccess} value="all" />
				All characters
			</label>
			<label>
				<input type="radio" bind:group={implant.characterAccess} value="none" />
				No characters
			</label>
			<label>
				<input type="radio" bind:group={implant.characterAccess} value="specific" />
				Specific characters
			</label>
			{#if implant.characterAccess === 'specific'}
				<CharacterAccessSelect
					characters={data.characters ?? []}
					bind:selectedIds={implant.allowedCharacterIds}
				/>
			{/if}
		</fieldset>
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

	fieldset {
		border: 1px solid var(--color-border, #444);
		border-radius: 4px;
		padding: 8px 12px;
		margin-top: 8px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	legend {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.6;
		padding: 0 4px;
	}

	label {
		display: flex;
		align-items: center;
		gap: 6px;
		cursor: pointer;
	}

</style>
