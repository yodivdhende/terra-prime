<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import ExpertiseForm from '$lib/components/expertise-form.svelte';
	import type { Expertise } from '$lib/db/expertise.repo';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();
	let expertise: Expertise | null = $state(null);
	$effect(() => {
		const { expertise: loadExpertise } = data;
		expertise = loadExpertise;
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
				await goto('.');
			} else {
				TOAST_MANAGER.error('Failed to save expertise');
			}
		} catch (err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
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
				await goto('.');
			} else {
				TOAST_MANAGER.error('Failed to delete expertise');
			}
		} catch (err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
	}
</script>

<main>
	<a href=".">back</a>
	{#if expertise != null}
		<ExpertiseForm bind:expertise groups={data.groups ?? []} />
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
