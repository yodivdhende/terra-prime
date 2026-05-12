<script lang="ts">
	type CharacterWithEvents = {
		id: number;
		name: string;
		events: { id: number; name: string }[];
	};

	let {
		selectedCharacterId = $bindable<number | null>(null),
		selectedEventId,
		oncreatenew
	}: {
		selectedCharacterId: number | null;
		selectedEventId: number;
		oncreatenew: () => void;
	} = $props();

	let characters = $state<CharacterWithEvents[]>([]);
	let loading = $state(true);

	$effect(() => {
		load(selectedEventId);
	});

	async function load(eventId: number) {
		loading = true;
		const [charsRes, meRes] = await Promise.all([
			fetch('/api/characters/with-events'),
			fetch(`/api/events/${eventId}/participants/me`)
		]);

		if (charsRes.ok) characters = await charsRes.json();

		if (meRes.status === 200) {
			const { characterId } = await meRes.json();
			selectedCharacterId = characterId;
		} else if (selectedCharacterId != null) {
			const stillOwned = characters.some((c) => c.id === selectedCharacterId);
			if (!stillOwned) selectedCharacterId = null;
		}

		loading = false;
	}

	function select(id: number) {
		selectedCharacterId = selectedCharacterId === id ? null : id;
	}
</script>

<div class="characters">
	{#if loading}
		<p class="status">loading…</p>
	{:else}
		<ul>
			{#each characters as char (char.id)}
				<li
					class="character"
					class:selected={selectedCharacterId === char.id}
					role="option"
					aria-selected={selectedCharacterId === char.id}
					tabindex="0"
					onclick={() => select(char.id)}
					onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') select(char.id); }}
				>
					<span class="name">{char.name}</span>
					{#if char.events.length > 0}
						<span class="events">
							{#each char.events as ev (ev.id)}
								<span class="badge">{ev.name}</span>
							{/each}
						</span>
					{:else}
						<span class="no-events">no previous events</span>
					{/if}
				</li>
			{/each}

			<li
				class="character create-new"
				role="option"
				aria-selected={false}
				tabindex="0"
				onclick={oncreatenew}
				onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') oncreatenew(); }}
			>
				<span class="name">+ create new character</span>
			</li>
		</ul>

		{#if characters.length === 0}
			<p class="status empty">no characters yet — create one to get started</p>
		{/if}
	{/if}
</div>

<style>
	.characters {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.character {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.6rem 0.75rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
		outline: none;
	}

	.character:hover,
	.character:focus {
		border-color: color-mix(in srgb, var(--color-accent) 50%, transparent);
	}

	.character.selected {
		border-color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 8%, transparent);
	}

	.character.selected .name {
		color: var(--color-accent);
	}

	.name {
		font-size: 0.8rem;
		letter-spacing: 0.04em;
	}

	.events {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.badge {
		font-size: 0.65rem;
		opacity: 0.6;
		padding: 0.1rem 0.4rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
	}

	.no-events {
		font-size: 0.65rem;
		opacity: 0.3;
		font-style: italic;
	}

	.create-new {
		border-style: dashed;
		opacity: 0.6;
	}

	.create-new:hover,
	.create-new:focus {
		opacity: 1;
	}

	.status {
		font-size: 0.75rem;
		opacity: 0.4;
	}

	.status.empty {
		font-style: italic;
		margin-top: 0.5rem;
	}
</style>
