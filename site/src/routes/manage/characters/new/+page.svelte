<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import BackstoryLink from '$lib/components/backstory-link.svelte';
	import CharacterForm from '$lib/components/character-form.svelte';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

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
				TOAST_MANAGER.success('Character created');
				await invalidate('/api/my/characters');
				await goto('.');
			}
		} catch (err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
	}
</script>

<main>
	<a href=".">back</a>
	{#if character != null}
		<CharacterForm bind:character={character} {users} />
		<BackstoryLink characterId={character.id} backstoryUrl={character.backstoryUrl} />
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
