<script lang="ts">
	import CharacterVersionShop from '$lib/codex/components/character-version-shop.svelte';
	import CharacterVersionOverview from '$lib/components/character-version-overview.svelte';
	import type { Character } from '$lib/db/character.repo';
	import type { CharacterVersionFull } from '$lib/codex/managers/character-manager.svelte';
	import { type PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();

	let character = $state<Character | null>(data.character ?? null);
	let version = $state<CharacterVersionFull | null>(data.version ?? null);

	$effect(() => {
		character = data.character ?? null;
		version = data.version ?? null;
	});

	const expertise = $derived(data.expertise);
	const items = $derived(data.items);
	const implants = $derived(data.implants);

	let saving = $state(false);
	let saveError = $state<string | null>(null);
	let saved = $state(false);

	async function save() {
		if (character == null || version == null) return;
		saving = true;
		saveError = null;
		saved = false;
		try {
			const result = await fetch(`/api/characters/${character.id}/versions/${version.id}`, {
				method: 'post',
				body: JSON.stringify($state.snapshot(version)),
				headers: { 'content-type': 'application/json' }
			});
			if (result.ok) {
				saved = true;
				TOAST_MANAGER.success('Version saved');
			} else {
				saveError = `save failed (${result.status})`;
				TOAST_MANAGER.error(`Save failed (${result.status})`);
			}
		} catch (err: any) {
			saveError = `${err}`;
			TOAST_MANAGER.error(err?.message ?? 'Something went wrong');
		} finally {
			saving = false;
		}
	}
</script>

<main>
	{#if character == null || version == null}
		<a href="/manage/characters">back</a>
		<p class="status">not found</p>
	{:else}
		<a href="/manage/characters/{character.id}">back</a>

		<div class="shop-wrapper">
			<CharacterVersionShop bind:character bind:version {expertise} {items} {implants} />
		</div>

		<div class="actions">
			{#if saveError}
				<span class="error">{saveError}</span>
			{:else if saved}
				<span class="success">saved</span>
			{/if}
			<button class="btn" onclick={save} disabled={saving}>
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
		box-sizing: border-box;
	}

	.shop-wrapper {
		flex: 1;
		min-height: 0;
		overflow: hidden;
		margin-top: 8px;
	}

	:global(.overview) {
		margin-top: 8px;
		flex-shrink: 0;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 0;
		margin-top: 8px;
		border-top: 1px solid silver;
	}

	button {
		padding: 6px 16px;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error {
		font-size: 0.8rem;
		color: #d95c5c;
	}

	.success {
		font-size: 0.8rem;
		color: #4caf82;
	}

	.status {
		font-size: 0.8rem;
		opacity: 0.5;
	}
</style>
