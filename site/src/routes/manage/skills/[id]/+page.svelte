<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import SkillForm from '$lib/components/skill-form.svelte';
	import type { Skill } from '$lib/db/skills.repo';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let skill: Skill | null = $state(null);
	$effect(() => {
		const { skill: loadSkill } = data;
		skill = loadSkill;
	});

	async function save() {
		const skillToSave = $state.snapshot(skill);
		if (skillToSave == null) return;
		const { id: skillId } = skillToSave;
		if (skillId == null) return;
		try {
			const result = await fetch(`/api/skills/${skillId}`, {
				method: 'post',
				body: JSON.stringify(skillToSave),
				headers: {
					'content-type': 'application/json'
				}
			});
			if (result.ok) {
				await invalidate('/api/skills');
				await goto('.');
			}
		} catch (err) {
			//TODO make error component;
		}
	}

	async function remove() {
		const skillToSave = $state.snapshot(skill);
		if (skillToSave == null) return;
		const { id: skillId } = skillToSave;
		if (skillId == null) return;
		try {
			const result = await fetch(`/api/skills/${skillId}`, {
				method: 'delete',
				headers: {
					'content-type': 'application/json'
				}
			});
			if (result.ok) {
				await goto('.');
			}
		} catch (err) {
			//TODO make error component;
		}
	}
</script>

<main>
	<a href=".">back</a>
	{#if skill != null}
		<SkillForm bind:skill groups={data.groups ?? []} />
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
