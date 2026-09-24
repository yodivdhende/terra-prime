<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import CharacterVersionShop from '$lib/components/character-version-shop.svelte';
	import {
		createCharacterManager,
		type CharacterManager
	} from '$lib/managers/character-manager.svelte';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';
	import type { ShopExpertise } from '$lib/components/shop-expertise.svelte';
	import type { ShopItem } from '$lib/components/shop-items.svelte';
	import type { ShopImplant } from '$lib/components/shop-implants.svelte';

	let saving = $state(false);

	// Created once at component init, since `createCharacterManager()` registers an `$effect`
	// internally that must run during component setup, not lazily inside a click handler.
	// `manager.character.id` (null until initialize() creates it) doubles as the "still
	// loading" state, so there's no separate copy to keep in sync.
	const manager: CharacterManager = createCharacterManager();
	let expertise = $state<ShopExpertise[]>([]);
	let items = $state<ShopItem[]>([]);
	let implants = $state<ShopImplant[]>([]);

	// The character-version-shop's own details tab already lets the admin name the
	// character, so there's no separate name prompt here: an NPC character + bare version
	// are created immediately (placeholder name) and renamed/filled in inline.
	// `onMount`, not `$effect`, since `initialize()` reassigns `manager.character` — an
	// `$effect` reading it first (via `ownerId`) would re-track and re-fire on that write.
	onMount(() => {
		initialize();
	});

	async function initialize() {
		try {
			const { ownerId } = manager.character;
			const characterRes = await fetch('/api/characters', {
				method: 'put',
				body: JSON.stringify({ name: 'New NPC', ownerId, kind: 'npc' }),
				headers: { 'content-type': 'application/json' }
			});
			if (!characterRes.ok) throw new Error(`create character failed (${characterRes.status})`);
			const { id: newCharacterId } = await characterRes.json();

			const versionRes = await fetch(`/api/characters/${newCharacterId}/versions`, {
				method: 'put'
			});
			if (!versionRes.ok) throw new Error(`create version failed (${versionRes.status})`);
			const { id: newVersionId } = await versionRes.json();

			const [expertiseRes, itemsRes, implantsRes, fullRes] = await Promise.all([
				fetch(`/api/expertise?characterId=${newCharacterId}`),
				fetch(`/api/items?characterId=${newCharacterId}`),
				fetch(`/api/implants?characterId=${newCharacterId}`),
				fetch(`/api/characters/versions/${newVersionId}/full`)
			]);
			expertise = expertiseRes.ok ? await expertiseRes.json() : [];
			items = itemsRes.ok ? await itemsRes.json() : [];
			implants = implantsRes.ok ? await implantsRes.json() : [];
			const full = fullRes.ok ? await fullRes.json() : null;
			if (!full) throw new Error('failed to load new version');

			manager.character = { ...manager.character, id: newCharacterId, name: 'New NPC' };
			manager.version = full;
			manager.setCatalog(expertise);
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function saveNewVersion() {
		const { id: activeCharacterId } = manager.character;
		const { id: activeVersionId } = manager.version;
		if (activeCharacterId == null || activeVersionId == null) return;
		saving = true;
		try {
			const characterSnapshot = $state.snapshot(manager.character);
			const versionSnapshot = $state.snapshot(manager.version);
			const [characterResult, versionResult] = await Promise.all([
				fetch(`/api/characters/${activeCharacterId}`, {
					method: 'post',
					body: JSON.stringify(characterSnapshot),
					headers: { 'content-type': 'application/json' }
				}),
				fetch(`/api/characters/${activeCharacterId}/versions/${activeVersionId}`, {
					method: 'post',
					body: JSON.stringify(versionSnapshot),
					headers: { 'content-type': 'application/json' }
				})
			]);
			if (characterResult.ok && versionResult.ok) {
				TOAST_MANAGER.success('Version created');
				await goto(resolve('/manage/characters/versions'));
			} else {
				TOAST_MANAGER.error('Save failed');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		} finally {
			saving = false;
		}
	}
</script>

<main>
	<a href={resolve('/manage/characters/versions')}>back</a>

	{#if manager.character.id == null}
		<p class="status">creating…</p>
	{:else}
		<div class="shop-wrapper">
			<CharacterVersionShop
				bind:character={manager.character}
				bind:version={manager.version}
				{expertise}
				{items}
				{implants}
				expertiseManager={manager.expertiseManager}
			/>
		</div>
		<div class="actions">
			<button
				class="btn"
				onclick={saveNewVersion}
				disabled={saving || manager.character.name.trim().length === 0}
			>
				{saving ? 'saving…' : 'save'}
			</button>
		</div>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
		height: 90vh;
		min-width: 60vh;
		box-sizing: border-box;
	}

	.status {
		margin-top: 8px;
		font-size: 0.8rem;
		opacity: 0.5;
	}

	.shop-wrapper {
		flex: 1;
		min-height: 0;
		overflow: hidden;
		margin-top: 8px;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 0;
		margin-top: 8px;
		border-top: 1px solid silver;
	}
</style>
