<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import CharacterForm from '$lib/components/character-form.svelte';
	import ConfirmModal from '$lib/components/confirm-modal.svelte';
	import { type Character } from '$lib/db/character.repo';
	import { CirclePlus } from '@lucide/svelte';
	import { type PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();
	let character: Character | null = $state(null);
	$effect(() => {
		const { character: loadCharacter } = data;
		character = loadCharacter ?? null;
	});
	const users = $derived(data.users);
	const versions = $derived(data.versions as { id: number; name: string }[]);

	async function save() {
		const characterToSave = $state.snapshot(character);
		if (characterToSave == null) return;
		const { id: characterId } = characterToSave;
		try {
			const result = await fetch(`/api/characters/${characterId}`, {
				method: 'post',
				body: JSON.stringify(characterToSave),
				headers: { 'content-type': 'application/json' }
			});
			if (result.ok) {
				TOAST_MANAGER.success('Character saved');
				await invalidate('/api/my/characters');
				await goto('.');
			}
		} catch (err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
	}

	let modal: ConfirmModal;

	async function deleteCharacter() {
		const id = $state.snapshot(character)?.id;
		if (id == null) return;
		try {
			const result = await fetch(`/api/characters/${id}`, { method: 'delete' });
			if (result.ok) {
				TOAST_MANAGER.success('Character deleted');
				await goto('.');
			}
		} catch (err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
	}

	async function addVersion() {
		const characterToSave = $state.snapshot(character);
		if (characterToSave == null) return;
		try {
			const result = await fetch(`/api/characters/${characterToSave.id}/versions`, {
				method: 'put'
			});
			if (result.ok) {
				const { id } = await result.json();
				await goto(`/manage/versions/${id}`);
			}
		} catch (err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
	}
</script>

<main>
	<a href=".">back</a>
	{#if character != null}
		<CharacterForm bind:character {users} />
	{/if}
	<div>
		<button class="btn" onclick={save}>save</button>
		<button class="btn btn-danger" onclick={() => modal.open()}>delete</button>
	</div>

	<ConfirmModal bind:this={modal} message="Delete this character?" onconfirm={deleteCharacter} oncancel={() => modal.close()} />

	<section class="versions">
		<h3>Versions</h3>
		{#if versions.length === 0}
			<p class="empty">no versions yet</p>
		{:else}
			<button class="btn add-version" onclick={addVersion}><CirclePlus size={14} /></button>
			<table>
				<thead>
					<tr>
						<th>Id</th>
						<th>Name</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each versions as version}
						<tr>
							<td>{version.id}</td>
							<td>{version.name}</td>
							<td><a href="/manage/versions/{version.id}">edit</a></td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
	}

	tr {
		border-bottom: 1px solid silver;
	}

	td {
		padding: 8px;
	}

	.versions {
		margin-top: 24px;
	}

	h3 {
		margin: 0 0 8px;
		font-size: 1rem;
	}

	.add-version {
		display: flex;
		align-items: center;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
		margin-bottom: 4px;
		color: var(--color-accent);
	}

	.add-version:hover {
		opacity: 0.6;
	}

	.empty {
		font-size: 0.8rem;
		opacity: 0.5;
		font-style: italic;
	}
</style>
