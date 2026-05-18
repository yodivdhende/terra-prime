<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import CharacterForm from '$lib/components/character-form.svelte';
	import { type Character } from '$lib/db/character.repo';
	import { type PageProps } from './$types';

	let { data }: PageProps = $props();
	let character: Character | null = $state(null);
	$effect(()=> {
		const {character: loadCharacter} = data;
		character = loadCharacter ?? null;
	});
	const users = $derived(data.users);

	async function save() {
		const characterToSave = $state.snapshot(character);
		if (characterToSave == null) return;
		const {id: characterId} = characterToSave;
		try {
			const result = await fetch(`/api/characters/${characterId}`, {
				method: 'post',
				body: JSON.stringify(characterToSave),
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
		<CharacterForm bind:character={character} {users} />
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
