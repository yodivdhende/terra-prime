<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import SubcoForm from '$lib/components/subco-form.svelte';
	import type { Subco } from '$lib/db/subco.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let subco: Subco = $state({
		id: null,
		name: '',
		company: 0,
		backstoryId: null,
		members: []
	});

	async function save() {
		try {
			const response = await fetch('/api/subco', {
				method: 'put',
				body: JSON.stringify($state.snapshot(subco)),
				headers: { 'content-type': 'application/json' }
			});
			if (response.ok) {
				TOAST_MANAGER.success('Subco created');
				await invalidate('/api/subco');
				await goto(resolve('/manage/subco'));
			} else {
				TOAST_MANAGER.error('Could not create subco');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}
</script>

<main>
	<a href={resolve('/manage/subco')}>back</a>
	<h1>new subco</h1>
	<SubcoForm bind:subco />
	<div>
		<button class="btn" onclick={save}>save</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
		gap: 8px;
	}
</style>
