<script lang="ts">
	import CharacterSkillGroups from '$lib/codex/components/character-skill-groups.svelte';
	import Icon from '$lib/codex/components/icon.svelte';
	import itemLogo from '$lib/assets/images/ItemLogo.svg?raw';
	import implantLogo from '$lib/assets/images/ImplantLogo.svg?raw';

	type VersionSummary = {
		id: number;
		name: string;
		lastEvent: { id: number; name: string } | null;
		skills: { id: number; group: number; groupName: string; value: number }[];
		itemCount: number;
		implantCount: number;
	};

	type CharacterWithVersions = {
		id: number;
		name: string;
		versions: VersionSummary[];
	};

	type FullCharacterVersion = {
		characterId: number;
		characterName: string;
		versionId: number;
		versionName: string;
		lastEvent: { id: number; name: string } | null;
		skills: { id: number; group: number; groupName: string; value: number }[];
		items: number[];
		implants: number[];
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

	let characters = $state<CharacterWithVersions[]>([]);
	let loading = $state(true);

	$effect(() => {
		load(selectedEventId);
	});

	async function load(eventId: number) {
		loading = true;
		const [versionsRes, meRes] = await Promise.all([
			fetch('/api/characters/versions'),
			fetch(`/api/events/${eventId}/participants/me`)
		]);

		if (versionsRes.ok) {
			const versions: FullCharacterVersion[] = await versionsRes.json();
			const map = new Map<number, CharacterWithVersions>();
			for (const v of versions) {
				if (!map.has(v.characterId)) {
					map.set(v.characterId, { id: v.characterId, name: v.characterName, versions: [] });
				}
				const char = map.get(v.characterId)!;

				char.versions.push({
					id: v.versionId,
					name: v.versionName,
					lastEvent: v.lastEvent,
					skills: v.skills,
					itemCount: v.items.length,
					implantCount: v.implants.length
				});
			}
			characters = Array.from(map.values());
		}

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
		<ul class="char-list">
			{#each characters as char (char.id)}
				<li class="character-group" class:selected={selectedCharacterId === char.id}>
					<div class="char-header">
						<span class="char-name">{char.name}</span>
					</div>
					<ul class="versions">
						{#each char.versions as ver (ver.id)}
							<li
								class="version"
								role="option"
								aria-selected={selectedCharacterId === char.id}
								tabindex="0"
								onclick={() => select(char.id)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') select(char.id);
								}}
							>
								<div class="version-header">
									<span class="version-name">{ver.name}</span>
									{#if ver.lastEvent}
										<span class="badge">{ver.lastEvent.name}</span>
									{:else}
										<span class="no-event">new</span>
									{/if}
								</div>
								<div class="version-stats">
									<CharacterSkillGroups skills={ver.skills} />
									<span class="stat">
										<Icon src={itemLogo} color="white" tooltip="Items" />
										{ver.itemCount}
									</span>
									<span class="stat">
										<Icon src={implantLogo} color="white" tooltip="Implants" />
										{ver.implantCount}
									</span>
								</div>
							</li>
						{/each}
					</ul>
				</li>
			{/each}

			<li
				class="create-new"
				role="option"
				aria-selected={false}
				tabindex="0"
				onclick={oncreatenew}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') oncreatenew();
				}}
			>
				<span class="char-name">+ create new character</span>
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

	.char-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.character-group {
		border: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
		transition: border-color 0.15s;
	}

	.character-group.selected {
		border-color: var(--color-accent);
	}

	.character-group.selected .char-name {
		color: var(--color-accent);
	}

	.char-header {
		padding: 0.5rem 0.75rem 0.3rem;
	}

	.char-name {
		font-size: 0.8rem;
		letter-spacing: 0.04em;
	}

	.versions {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.version {
		padding: 0.4rem 0.75rem 0.5rem 1rem;
		border-top: 1px solid color-mix(in srgb, var(--color-accent) 12%, transparent);
		cursor: pointer;
		outline: none;
		transition: background 0.1s;
	}

	.version:hover,
	.version:focus {
		background: color-mix(in srgb, var(--color-accent) 5%, transparent);
	}

	.character-group.selected .version:hover,
	.character-group.selected .version:focus {
		background: color-mix(in srgb, var(--color-accent) 10%, transparent);
	}

	.version-header {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 0.3rem;
	}

	.version-name {
		font-size: 0.72rem;
		opacity: 0.75;
	}

	.badge {
		font-size: 0.62rem;
		opacity: 0.55;
		padding: 0.1rem 0.35rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
	}

	.no-event {
		font-size: 0.62rem;
		opacity: 0.25;
		font-style: italic;
	}

	.version-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.5rem;
	}

	.stat {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		font-size: 0.62rem;
	}

	.create-new {
		border: 1px dashed color-mix(in srgb, var(--color-accent) 20%, transparent);
		padding: 0.6rem 0.75rem;
		cursor: pointer;
		opacity: 0.6;
		outline: none;
		transition:
			opacity 0.15s,
			border-color 0.15s;
	}

	.create-new:hover,
	.create-new:focus {
		opacity: 1;
		border-color: color-mix(in srgb, var(--color-accent) 50%, transparent);
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
