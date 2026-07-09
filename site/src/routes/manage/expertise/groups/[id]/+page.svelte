<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ExpertiseGroupForm from '$lib/components/expertise-group-form.svelte';
	import type { ExpertiseGroup } from '$lib/db/expertise.repo';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();
	let group: ExpertiseGroup | null = $state(null);
	$effect(() => {
		const { group: loadGroup } = data;
		group = loadGroup;
	});

	async function save() {
		const groupToSave = $state.snapshot(group);
		if (groupToSave == null) return;
		const { id: groupId } = groupToSave;
		if (groupId == null) return;
		try {
			const result = await fetch(`/api/expertise/groups/${groupId}`, {
				method: 'post',
				body: JSON.stringify(groupToSave),
				headers: {
					'content-type': 'application/json'
				}
			});
			if (result.ok) {
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

	async function remove() {
		const groupToRemove = $state.snapshot(group);
		if (groupToRemove == null) return;
		const { id: groupId } = groupToRemove;
		if (groupId == null) return;
		try {
			const result = await fetch(`/api/expertise/groups/${groupId}`, {
				method: 'delete',
				headers: {
					'content-type': 'application/json'
				}
			});
			if (result.ok) {
				TOAST_MANAGER.success('Expertise group deleted');
				await invalidate('/api/expertise/groups');
				await goto(resolve('/manage/expertise/groups'));
			} else {
				TOAST_MANAGER.error('Failed to delete expertise group');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}
</script>

<main>
	<a href={resolve('/manage/expertise/groups')}>back</a>
	{#if group != null}
		<ExpertiseGroupForm bind:group={group} />
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
