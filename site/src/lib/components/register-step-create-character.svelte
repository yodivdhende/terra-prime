<script lang="ts">
	import CharacterVersionShop from './character-version-shop.svelte';
	import type { ShopExpertise } from './shop-expertise.svelte';
	import type { ShopItem } from './shop-items.svelte';
	import type { ShopImplant } from './shop-implants.svelte';
	import type { RegisterManager } from '$lib/managers/register-manager.svelte';
	import type { CharacterManager } from '$lib/managers/character-manager.svelte';

	type EventResponse = {
		id: number;
		name: string;
		budget?: number | null;
	};

	let {
		REGISTER_MANAGER,
		CHARACTER_MANAGER
	}: { REGISTER_MANAGER: RegisterManager; CHARACTER_MANAGER: CharacterManager } = $props();

	let expertise = $state<ShopExpertise[]>([]);
	let items = $state<ShopItem[]>([]);
	let implants = $state<ShopImplant[]>([]);
	let budget = $state<number>(0);
	let loading = $state(true);
	let error = $state<string | null>(null);

	$effect(() => {
		load(REGISTER_MANAGER.selectedEventId!);
	});

	async function load(eventId: number) {
		loading = true;
		error = null;
		try {
			const characterId = CHARACTER_MANAGER.character.id;
			const charParam = characterId != null ? `?characterId=${characterId}` : '';
			const [expertiseRes, itemsRes, implantsRes, eventRes] = await Promise.all([
				fetch(`/api/expertise${charParam}`),
				fetch(`/api/items${charParam}`),
				fetch(`/api/implants${charParam}`),
				fetch(`/api/events/${eventId}`)
			]);

			if (expertiseRes.ok) {
				expertise = await expertiseRes.json();
				CHARACTER_MANAGER.setCatalog(expertise);
			}
			if (itemsRes.ok) items = await itemsRes.json();
			if (implantsRes.ok) implants = await implantsRes.json();
			if (eventRes.ok) {
				const event: EventResponse = await eventRes.json();
				const base = event.budget ?? 0;
				if (characterId != null) {
					const extraRes = await fetch(
						`/api/events/${eventId}/budget/characters/${characterId}`
					);
					const extra = extraRes.ok
						? ((await extraRes.json()) as { budget: number }).budget
						: 0;
					budget = base + extra;
				} else {
					budget = base;
				}
			}
		} catch (err) {
			error = `${err}`;
		} finally {
			loading = false;
		}
	}
</script>

<div class="create-character">
	<div class="mode-label">
		{REGISTER_MANAGER.editMode ? 'editing version' : 'new character'}
	</div>

	{#if loading}
		<p class="status">loading…</p>
	{:else if error}
		<p class="status error">failed to load: {error}</p>
	{:else}
		<CharacterVersionShop
			bind:character={CHARACTER_MANAGER.character}
			bind:version={CHARACTER_MANAGER.version}
			{expertise}
			{items}
			{implants}
			{budget}
			expertiseManager={CHARACTER_MANAGER.expertiseManager}
		/>
	{/if}
</div>

<style>
	.create-character {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.mode-label {
		font-size: 0.65em;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.35;
		padding: 0 0 0.5rem 0;
	}

	/* ── Status ── */

	.status {
		font-size: 0.75em;
		opacity: 0.4;
	}

	.status.error {
		color: #d95c5c;
		opacity: 0.7;
	}
</style>
