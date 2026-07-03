<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import SkillGroupForm from '$lib/components/skill-group-form.svelte';
	import type { SkillGroup } from '$lib/db/skills.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let group: SkillGroup = $state({
		id: null,
		name: '',
		description: ''
	});

	async function save() {
		try {
			const response = await fetch('/api/skills/groups', {
				method: 'put',
				body: JSON.stringify($state.snapshot(group))
			});
			if (response.ok) {
				TOAST_MANAGER.success('Skill group saved');
				await invalidate('/api/skills/groups');
				await goto('.');
			} else {
				TOAST_MANAGER.error('Failed to save skill group');
			}
		} catch (err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
	}
</script>

<main>
	<a href=".">back</a>
	<h1>new skill group</h1>
	{#if group!= null}
		<SkillGroupForm bind:group={group}/>
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
