<script lang="ts">
	import { type RegisterManager } from '../managers/register-manager.svelte';
	import {
		type Character,
		type CharacterManager,
		type CharacterVersion
	} from '../managers/character-manager.svelte';

	let {
		REGISTER_MANAGER,
		CHARACTER_MANAGER
	}: { REGISTER_MANAGER: RegisterManager; CHARACTER_MANAGER: CharacterManager } = $props();

	let event = REGISTER_MANAGER.selectedEvent;
	let displayCharacterName = CHARACTER_MANAGER.character.name;
	let displayVersionName = CHARACTER_MANAGER.version.name;
	let displaySkills = CHARACTER_MANAGER.version.skills;
	let displayItems = CHARACTER_MANAGER.version.items;
	let displayImplants = CHARACTER_MANAGER.version.implants;
	let loading = $state(true);
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	async function confirm() {
		if (submitting) return;
		submitting = true;
		error = null;
		try {
			const body = getCharacterWithVerions({
				character: $state.snapshot(CHARACTER_MANAGER.character),
				version: $state.snapshot(CHARACTER_MANAGER.version)
			});
			const res = await fetch(`/api/my/events/${REGISTER_MANAGER.selectedEventId}/participants`, {
				method: 'POST',
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

	function getCharacterWithVerions({
		character,
		version
	}: {
		character: Character;
		version: CharacterVersion;
	}) {
		return {
			id: character.id,
			name: character.name,
			ownerId: character.ownerId,
			ownerName: character.ownerName,
			versions: [
				{
					id: version.id,
					name: version.name,
					characterId: character.id,
					skills: version.skills,
					items: version.items,
					implants: version.implants
				}
			]
		};
	}
</script>

<div class="confirm">
	{#if loading}
		<p class="status">loading…</p>
	{:else if success}
		<div class="success">
			<p class="success-title">registration confirmed</p>
			<p class="success-hint">
				you are registered for <span class="highlight">{event?.name}</span> as
				<span class="highlight">{displayCharacterName}</span>
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

		{#if displayCharacterName}
			<CharacterVersion
				characterName={displayCharacterName}
				versionName={displayVersionName}
				skills={displaySkills}
				items={displayItems}
				implants={displayImplants}
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

	.status {
		font-size: 0.75rem;
		opacity: 0.4;
	}
</style>
