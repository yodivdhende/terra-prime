<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ExpertiseGroupForm from '$lib/components/expertise-group-form.svelte';
	import type { ExpertiseGroup } from '$lib/db/expertise.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let group: ExpertiseGroup = $state({
		id: null,
		name: '',
		description: ''
	});

	async function save() {
		try {
			const response = await fetch('/api/expertise/groups', {
				method: 'put',
				body: JSON.stringify($state.snapshot(group))
			});
			if (response.ok) {
				TOAST_MANAGER.success('Expertise group saved');
				await invalidate('/api/expertise/groups');
				await goto(resolve('/manage/expertise/groups'));
			} else {
				TOAST_MANAGER.error('Failed to save expertise group');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}
</script>

<main>
	<a href={resolve('/manage/expertise/groups')}>back</a>
	<h1>new expertise group</h1>
	{#if group!= null}
		<ExpertiseGroupForm bind:group={group}/>
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
