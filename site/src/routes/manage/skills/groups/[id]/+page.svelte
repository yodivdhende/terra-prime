<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import SkillGroupForm from '$lib/components/skill-group-form.svelte';
	import type { SkillGroup } from '$lib/db/skills.repo';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let group: SkillGroup | null = $state(null);
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
			const result = await fetch(`/api/skills/groups/${groupId}`, {
				method: 'post',
				body: JSON.stringify(groupToSave),
				headers: {
					'content-type': 'application/json'
				}
			});
			if (result.ok) {
				await invalidate('/api/skills/groups');
				await goto('.');
			}
		} catch (err) {
			//TODO make error component;
		}
	}

	async function remove() {
		const groupToRemove = $state.snapshot(group);
		if (groupToRemove == null) return;
		const { id: groupId } = groupToRemove;
		if (groupId == null) return;
		try {
			const result = await fetch(`/api/skills/groups/${groupId}`, {
				method: 'delete',
				headers: {
					'content-type': 'application/json'
				}
			});
			if (result.ok) {
				await invalidate('/api/skills/groups');
				await goto('.');
			}
		} catch (err) {
			//TODO make error component;
		}
	}
</script>

<main>
	<a href=".">back</a>
	{#if group != null}
		<SkillGroupForm bind:group={group} />
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
