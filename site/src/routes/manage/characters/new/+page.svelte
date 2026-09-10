<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BackstoryLink from '$lib/components/backstory-link.svelte';
	import CharacterForm from '$lib/components/character-form.svelte';
	import type { NewCharacter } from '$lib/db/character.repo';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();
	let character = $state<NewCharacter>({
		name: '',
		ownerId: 1,
		backstoryId: null
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
				TOAST_MANAGER.success('Character created');
				await invalidate('/api/my/characters');
				await goto(resolve('/manage/characters'));
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}
</script>

<main>
	<a href={resolve('/manage/characters')}>back</a>
	{#if character != null}
		<CharacterForm bind:character={character} {users} />
		<BackstoryLink characterId={null} bind:backstoryId={character.backstoryId} />
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
