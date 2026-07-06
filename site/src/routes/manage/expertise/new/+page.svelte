<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import ExpertiseForm from '$lib/components/expertise-form.svelte';
	import type { Expertise } from '$lib/db/expertise.repo';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	const {data}: PageProps = $props();
	let expertise: Expertise = $state({
		id: null,
		groupId: 0,
		groupName: '',
		name: '',
		description: ''
	});

	async function save() {
		try {
			const response = await fetch('/api/expertise', {
				method: 'put',
				body: JSON.stringify($state.snapshot(expertise))
			});
			if (response.ok) {
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
</script>

<main>
	<a href=".">back</a>
	<h1>new expertise</h1>
	{#if expertise != null}
		<ExpertiseForm bind:expertise groups={data.groups ?? []}/>
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
