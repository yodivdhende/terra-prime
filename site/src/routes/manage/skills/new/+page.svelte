<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import SkillForm from '$lib/components/skill-form.svelte';
	import type { Skill } from '$lib/db/skills.repo';
	import type { PageProps } from './$types';

	const {data}: PageProps = $props();
	let skill: Skill = $state({
		id: null,
		groupId: 0,
		groupName: '',
		name: '',
		description: ''
	});

	async function save() {
		const response = await fetch('/api/skills', {
			method: 'put',
			body: JSON.stringify($state.snapshot(skill))
		});
		if (response.ok) {
			await invalidate('/api/skills');
			await goto('.');
		}
	}
</script>

<main>
	<a href=".">back</a>
	<h1>new skill</h1>
	{#if skill!= null}
		<SkillForm bind:skill groups={data.groups ?? []}/>
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
