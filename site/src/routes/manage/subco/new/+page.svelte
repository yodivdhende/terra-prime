<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import SubcoForm from '$lib/components/subco-form.svelte';
	import SearchSelect from '$lib/components/search-select.svelte';
	import type { Subco } from '$lib/db/subco.repo';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();

	let subco: Subco = $state({
		id: null,
		name: '',
		company: 0,
		backstoryId: null,
		ownerId: 0,
		members: []
	});

	const ownerOptions = $derived(
		data.allUsers.map((u) => ({ label: `${u.name} (${u.email})`, value: String(u.id) }))
	);

	async function save() {
		if (subco.ownerId === 0) {
			TOAST_MANAGER.warning('Select an owner');
			return;
		}
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
	<label class="owner">
		owner
		<SearchSelect
			options={ownerOptions}
			placeholder="Search player..."
			onselect={(o) => (subco.ownerId = Number(o.value))}
		/>
	</label>
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
