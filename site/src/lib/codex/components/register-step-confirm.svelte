<script lang="ts">
	import { type RegisterManager } from '../managers/register-manager.svelte';
	import {
		type Character,
		type CharacterManager,
		type CharacterVersionFull
	} from '../managers/character-manager.svelte';
	import CharacterVersion from './character-version.svelte';

	let {
		REGISTER_MANAGER,
		CHARACTER_MANAGER
	}: { REGISTER_MANAGER: RegisterManager; CHARACTER_MANAGER: CharacterManager } = $props();

	let event = $derived(REGISTER_MANAGER.selectedEvent);
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	type CharacterVersionBare = {
		id: number | null;
		characterId: number;
		name: string;
		skills: { id: number; value: number }[];
		items: { id: number; count: number }[];
		implants: number[];
	};

	type CharacterWithVersions = {
		id: number | null;
		name: string;
		ownerId: number;
		ownerName: string;
		versions: CharacterVersionBare[];
	};

	async function confirm() {
		if (submitting) return;
		submitting = true;
		error = null;
		try {
			const body = toCharacterWithVersions({
				character: $state.snapshot(CHARACTER_MANAGER.character),
				version: $state.snapshot(CHARACTER_MANAGER.version)
			});
			const res = await fetch(`/api/my/events/${REGISTER_MANAGER.selectedEventId}/participants`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) throw new Error(`registration failed (${res.status})`);
			success = true;
		} catch (err) {
			error = `${err instanceof Error ? err.message : err}`;
		} finally {
			submitting = false;
		}
	}

	function toCharacterWithVersions({
		character,
		version
	}: {
		character: Character;
		version: CharacterVersionFull;
	}): CharacterWithVersions {
		return {
			id: character.id,
			name: character.name,
			ownerId: character.ownerId,
			ownerName: character.ownerName,
			versions: [
				{
					id: version.id,
					characterId: character.id ?? 0,
					name: version.name,
					skills: version.skills.map(({ id, value }) => ({ id, value })),
					items: version.items.map(({ id, count }) => ({ id, count })),
					implants: version.implants.map(({ id }) => id)
				}
			]
		};
	}
</script>

<div class="confirm">
	{#if success}
		<div class="success">
			<p class="success-title">registration confirmed</p>
			<p class="success-hint">
				you are registered for <span class="highlight">{event?.name}</span> as
				<span class="highlight">{CHARACTER_MANAGER.character.name}</span>
			</p>
		</div>
	{:else}
		<div class="event-row">
			<span class="event-label">event</span>
			<span class="event-name">{event?.name ?? '—'}</span>
			{#if REGISTER_MANAGER.isNewCharacter}
				<span class="badge">new character</span>
			{/if}
		</div>

		{#if CHARACTER_MANAGER.character.name}
			<CharacterVersion
				characterName={CHARACTER_MANAGER.character.name}
				versionName={CHARACTER_MANAGER.version.name}
				skills={CHARACTER_MANAGER.version.skills}
				items={CHARACTER_MANAGER.version.items}
				implants={CHARACTER_MANAGER.version.implants}
			/>
		{/if}

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<button class="confirm-btn" onclick={confirm} disabled={submitting}>
			{submitting ? 'confirming…' : 'confirm registration'}
		</button>
	{/if}
</div>

<style>
	.confirm {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		height: 100%;
	}

	.event-row {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
	}

	.event-label {
		font-size: 0.62rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.4;
		flex-shrink: 0;
	}

	.event-name {
		font-size: 0.82rem;
		flex: 1;
	}

	.badge {
		font-size: 0.62rem;
		opacity: 0.5;
		padding: 0.1rem 0.35rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
	}

	.confirm-btn {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		padding: 0.45rem 1rem;
		background: transparent;
		color: var(--color-accent);
		border: 1px solid color-mix(in srgb, var(--color-accent) 50%, transparent);
		cursor: pointer;
		align-self: flex-start;
		transition:
			border-color 0.15s,
			opacity 0.15s;
	}

	.confirm-btn:hover:not(:disabled) {
		border-color: var(--color-accent);
	}

	.confirm-btn:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.error {
		font-size: 0.75rem;
		color: #d95c5c;
		opacity: 0.85;
	}

	.success {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		padding: 1.25rem;
	}

	.success-title {
		font-size: 0.8rem;
		color: var(--color-accent);
		letter-spacing: 0.06em;
	}

	.success-hint {
		font-size: 0.72rem;
		opacity: 0.55;
	}

	.highlight {
		opacity: 1;
		color: var(--color-main);
	}
</style>
