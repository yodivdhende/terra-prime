<script lang="ts">
	import { type CodexWindow } from '$lib/managers/window-manager.svelte';
	import BackstoryLink from '$lib/components/backstory-link.svelte';
	import { FEATURE_MANAGER } from '$lib/managers/feature-manager.svelte';
	import CharacterVersion, {
		type CharacterVersionExpertise,
		type CharacterVersionItem,
		type CharacterVersionImplant
	} from '$lib/components/character-version.svelte';

	let { window: _window }: { window: CodexWindow } = $props();

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
	let selectedVersionId = $state<number | null>(null);

	const selectedVersion = $derived.by(() => {
		for (const c of characters) {
			const v = c.versions.find((v) => v.id === selectedVersionId);
			if (v) return v;
		}
		return null;
	});

	const selectedCharacter = $derived(
		characters.find((c) => c.versions.some((v) => v.id === selectedVersionId)) ?? null
	);

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
				if (selectedVersionId == null) {
					selectedVersionId = characters[0]?.versions[0]?.id ?? null;
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
				<div class="character-node">
					<div class="character-header">
						<span class="character-name">{character.name}</span>
						{#if FEATURE_MANAGER.backstoryEnabled}
							<BackstoryLink
								characterId={character.id}
								characterName={character.name}
								bind:backstoryId={character.backstoryId}
							/>
						{/if}
					</div>
					{#each character.versions as version (version.id)}
						<button
							class="version-entry"
							class:active={selectedVersionId === version.id}
							onclick={() => (selectedVersionId = version.id)}
						>
							{version.name}
						</button>
					{/each}
					{#if character.versions.length === 0}
						<span class="no-versions">no versions</span>
					{/if}
				</div>
			{/each}
		{/if}
	</div>

	<div class="detail">
		{#if selectedVersion == null}
			<span class="status">select a version</span>
		{:else}
			<div class="detail-scroll">
				{#if selectedVersion.events.length > 0}
					<div class="version-events">
						{#each selectedVersion.events as event (event.id)}
							<span class="event-tag">{event.name}</span>
						{/each}
					</div>
				{/if}
				<CharacterVersion
					characterName={selectedCharacter?.name ?? ''}
					versionName={selectedVersion.name}
					companyName={selectedVersion.company?.name ?? null}
					expertise={selectedVersion.expertise}
					items={selectedVersion.items}
					implants={selectedVersion.implants}
				/>
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

	.character-node {
		display: flex;
		flex-direction: column;
		border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
		padding: 0.4rem 0;
	}

	.character-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.2rem 0.75rem;
		gap: 0.5rem;
	}

	.character-name {
		font-size: 0.75em;
		letter-spacing: 0.03em;
		opacity: 0.9;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.version-entry {
		display: flex;
		align-items: center;
		padding: 0.2rem 0.75rem 0.2rem 1.25rem;
		background: none;
		border: none;
		color: var(--color-main);
		font-family: inherit;
		font-size: 0.68em;
		text-align: left;
		cursor: pointer;
		width: 100%;
		letter-spacing: 0.03em;
		opacity: 0.55;
		transition: opacity 0.1s;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.version-entry:hover {
		opacity: 0.85;
	}

	.version-entry.active {
		opacity: 1;
		color: var(--color-accent);
	}

	.no-versions {
		padding: 0.15rem 0.75rem 0.15rem 1.25rem;
		font-size: 0.62em;
		opacity: 0.3;
		letter-spacing: 0.06em;
		text-transform: uppercase;
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
