<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ExpertiseForm from '$lib/components/expertise-form.svelte';
	import CharacterAccessSelect from '$lib/components/character-access-select.svelte';
	import type { Expertise } from '$lib/db/expertise.repo';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();
	let expertise: Expertise | null = $state(null);
	$effect(() => {
		const { expertise: loadExpertise } = data;
		expertise = loadExpertise ?? null;
	});

	async function save() {
		const expertiseToSave = $state.snapshot(expertise);
		if (expertiseToSave == null) return;
		const { id: expertiseId } = expertiseToSave;
		if (expertiseId == null) return;
		try {
			const result = await fetch(`/api/expertise/${expertiseId}`, {
				method: 'post',
				body: JSON.stringify(expertiseToSave),
				headers: {
					'content-type': 'application/json'
				}
			});
			if (result.ok) {
				TOAST_MANAGER.success('Expertise saved');
				await invalidate('/api/expertise');
				await goto(resolve('/manage/expertise'));
			} else {
				TOAST_MANAGER.error('Failed to save expertise');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function remove() {
		const expertiseToSave = $state.snapshot(expertise);
		if (expertiseToSave == null) return;
		const { id: expertiseId } = expertiseToSave;
		if (expertiseId == null) return;
		try {
			const result = await fetch(`/api/expertise/${expertiseId}`, {
				method: 'delete',
				headers: {
					'content-type': 'application/json'
				}
			});
			if (result.ok) {
				TOAST_MANAGER.success('Expertise deleted');
				await goto(resolve('/manage/expertise'));
			} else {
				TOAST_MANAGER.error('Failed to delete expertise');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

</script>

<main>
	<a href={resolve('/manage/expertise')}>back</a>
	{#if expertise != null}
		<ExpertiseForm bind:expertise groups={data.groups ?? []} />

		<fieldset>
			<legend>Character Access</legend>
			<label>
				<input type="radio" bind:group={expertise.characterAccess} value="all" />
				All characters
			</label>
			<label>
				<input type="radio" bind:group={expertise.characterAccess} value="none" />
				No characters
			</label>
			<label>
				<input type="radio" bind:group={expertise.characterAccess} value="specific" />
				Specific characters
			</label>
			{#if expertise.characterAccess === 'specific'}
				<CharacterAccessSelect
					characters={data.characters ?? []}
					bind:selectedIds={
						() => expertise!.allowedCharacterIds ?? [],
						(v) => (expertise!.allowedCharacterIds = v)
					}
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
