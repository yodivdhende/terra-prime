<script lang="ts">
	import { type CodexWindow } from '$lib/codex/managers/window-manager.svelte';
	import CharacterVersion, {
		type CharacterVersionExpertise,
		type CharacterVersionItem,
		type CharacterVersionImplant
	} from '$lib/codex/components/character-version.svelte';

	let { window }: { window: CodexWindow } = $props();

	type VersionEvent = { id: number; name: string };

	type VersionFull = {
		id: number;
		characterId: number;
		name: string;
		company: { id: number; name: string } | null;
		expertise: CharacterVersionExpertise[];
		items: CharacterVersionItem[];
		implants: CharacterVersionImplant[];
		events: VersionEvent[];
	};

	type CharacterEntry = {
		id: number;
		name: string;
		backstoryId?: string | null;
		versions: VersionFull[];
	};

	let characters = $state<CharacterEntry[]>([]);
	let loading = $state(true);
	let failed = $state(false);
	let selectedId = $state<number | null>(null);

	let selected = $derived(characters.find((c) => c.id === selectedId) ?? null);

	$effect(() => {
		loading = true;
		failed = false;
		fetch('/api/my/characters/versions')
			.then((r) => {
				if (!r.ok) throw new Error();
				return r.json();
			})
			.then((data: { characters: CharacterEntry[] }) => {
				characters = data.characters;
				if (characters.length > 0 && selectedId == null) {
					selectedId = characters[0].id;
				}
				loading = false;
			})
			.catch(() => {
				failed = true;
				loading = false;
			});
	});
</script>

<div class="overview-window">
	<div class="tree">
		{#if loading}
			<span class="status">loading...</span>
		{:else if failed}
			<span class="status error">failed to load</span>
		{:else if characters.length === 0}
			<span class="status">no characters found</span>
		{:else}
			{#each characters as character (character.id)}
				<button
					class="entry"
					class:active={selectedId === character.id}
					onclick={() => (selectedId = character.id)}
				>
					{character.name}
				</button>
			{/each}
		{/if}
	</div>

	<div class="detail">
		{#if selected == null}
			<span class="status">select a character</span>
		{:else}
			<div class="detail-scroll">
				{#if selected.backstoryId}
					<div class="backstory-row">
						<a
							href="https://docs.google.com/document/d/{selected.backstoryId}/edit"
							target="_blank"
							rel="noopener noreferrer"
							class="backstory-link"
						>
							open backstory
						</a>
					</div>
				{/if}

				{#each selected.versions as version (version.id)}
					<div class="version-block">
						{#if version.events.length > 0}
							<div class="version-events">
								{#each version.events as event (event.id)}
									<span class="event-tag">{event.name}</span>
								{/each}
							</div>
						{/if}
						<CharacterVersion
							characterName={selected.name}
							versionName={version.name}
							companyName={version.company?.name ?? null}
							expertise={version.expertise}
							items={version.items}
							implants={version.implants}
						/>
					</div>
				{/each}

				{#if selected.versions.length === 0}
					<span class="status">no versions yet</span>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.overview-window {
		display: grid;
		grid-template-columns: 1fr 2fr;
		height: 100%;
		overflow: hidden;
		font-size: 1rem;
	}

	.tree {
		border-right: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		overflow-y: auto;
		padding: 0.5rem 0;
		display: flex;
		flex-direction: column;
	}

	.entry {
		display: flex;
		align-items: center;
		padding: 0.25rem 0.75rem;
		background: none;
		border: none;
		color: var(--color-main);
		font-family: inherit;
		font-size: 0.75em;
		text-align: left;
		cursor: pointer;
		width: 100%;
		letter-spacing: 0.03em;
		opacity: 0.75;
		transition: opacity 0.1s;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.entry:hover {
		opacity: 1;
	}

	.entry.active {
		opacity: 1;
		color: var(--color-accent);
	}

	.status {
		display: block;
		padding: 0.5rem 0.75rem;
		opacity: 0.4;
		font-size: 0.7em;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.status.error {
		color: var(--color-accent);
		opacity: 1;
	}

	.detail {
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.detail-scroll {
		overflow-y: auto;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		flex: 1;
	}

	.backstory-row {
		padding-bottom: 0.5rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
	}

	.backstory-link {
		font-size: 0.72em;
		color: var(--color-accent);
		text-decoration: none;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		opacity: 0.8;
		transition: opacity 0.1s;
	}

	.backstory-link:hover {
		opacity: 1;
		text-decoration: underline;
	}

	.version-block {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
	}

	.version-block:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.version-events {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.event-tag {
		font-size: 0.6em;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		opacity: 0.5;
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		padding: 0.1rem 0.4rem;
	}
</style>
