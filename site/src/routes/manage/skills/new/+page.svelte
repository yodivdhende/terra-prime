<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import SkillForm from '$lib/components/skill-form.svelte';
	import type { Skill } from '$lib/db/skills.repo';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	const {data}: PageProps = $props();
	let skill: Skill = $state({
		id: null,
		groupId: 0,
		groupName: '',
		name: '',
		description: ''
	});

	async function save() {
		try {
			const response = await fetch('/api/skills', {
				method: 'put',
				body: JSON.stringify($state.snapshot(skill))
			});
			if (response.ok) {
				TOAST_MANAGER.success('Skill saved');
				await invalidate('/api/skills');
				await goto('.');
			} else {
				TOAST_MANAGER.error('Failed to save skill');
			}
		} catch (err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
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
