<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import SkillGroupForm from '$lib/components/skill-group-form.svelte';
	import type { SkillGroup } from '$lib/db/skills.repo';

	let group: SkillGroup = $state({
		id: null,
		name: '',
		description: ''
	});

	async function save() {
		const response = await fetch('/api/skills/groups', {
			method: 'put',
			body: JSON.stringify($state.snapshot(group))
		});
		if (response.ok) {
			await invalidate('/api/skills/groups');
			await goto('.');
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
		<button onclick={save}>save</button>
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
