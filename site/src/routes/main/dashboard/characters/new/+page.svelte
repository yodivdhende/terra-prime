<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import CharacterForm from '$lib/components/character-form.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let character = $state({
		name: '',
		ownerId: 1
	});
	const users = $derived(data.users);

	async function save() {
		try {
			const result = await fetch(`/api/characters`, {
				method: 'put',
				body: JSON.stringify(character),
				headers: {
					'content-type': 'application/json'
				}
			});
			if (result.ok) {
        await invalidate('/api/my/characters');
				await goto('.');
			}
		} catch (err) {
			//TODO make error component;
		}
	}
</script>

<main>
	<a href=".">back</a>
	{#if character != null}
		<CharacterForm bind:character {users} />
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
