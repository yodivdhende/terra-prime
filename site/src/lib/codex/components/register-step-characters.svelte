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
		items: { id: number; count: number }[];
		implants: number[];
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
		items: { id: number; count: number }[];
		implants: number[];
	};

	import type { CharacterManager } from '../managers/character-manager.svelte';
	import type { RegisterManager } from '../managers/register-manager.svelte';
	import { SvelteMap } from 'svelte/reactivity';

	let {
		REGISTER_MANAGER,
		CHARACTER_MANAGER
	}: { REGISTER_MANAGER: RegisterManager; CHARACTER_MANAGER: CharacterManager } = $props();

	let characters = $state<CharacterWithVersions[]>([]);
	let loading = $state(true);

	$effect(() => {
		load(REGISTER_MANAGER.selectedEventId!);
	});

	async function load(eventId: number) {
		loading = true;
		const versionsRes = await fetch('/api/my/characters/versions');

		if (versionsRes.ok) {
			const versions: FullCharacterVersion[] = await versionsRes.json();
			const map = new SvelteMap<number, CharacterWithVersions>();
			for (const version of versions) {
				if (!map.has(version.characterId)) {
					map.set(version.characterId, {
						id: version.characterId,
						name: version.characterName,
						versions: []
					});
				}
				const char = map.get(version.characterId)!;

				char.versions.push({
					id: version.versionId,
					name: version.versionName,
					lastEvent: version.lastEvent,
					skills: version.skills,
					items: version.items,
					implants: version.implants,
					itemCount: version.items.reduce((s, i) => s + i.count, 0),
					implantCount: version.implants.length
				});

				if (version.lastEvent?.id === eventId) {
					CHARACTER_MANAGER.character = { id: version.characterId, name: version.characterName };
					CHARACTER_MANAGER.version = {
						id: version.versionId,
						name: version.versionName,
						skills: version.skills,
						items: version.items,
						implants: version.implants
					};
				}
			}
			characters = Array.from(map.values());
		}

		loading = false;
	}

	function selectVersion(char: CharacterWithVersions, ver: VersionSummary) {
		CHARACTER_MANAGER.character = { ...char };
		CHARACTER_MANAGER.version = {
			...ver,
			skills: ver.skills.map((s) => ({ id: s.id, value: s.value }))
		};
	}

	function createNewCharacter(): void {
		CHARACTER_MANAGER.reset();
		REGISTER_MANAGER.next();
	}
</script>

<div class="characters">
	{#if loading}
		<p class="status">loading…</p>
	{:else}
		<ul class="char-list">
			{#each characters as char (char.id)}
				<li class="character-group" class:selected={CHARACTER_MANAGER.character.id === char.id}>
					<div class="char-header">
						<span class="char-name">{char.name}</span>
					</div>
					<ul class="versions">
						{#each char.versions as ver (ver.id)}
							<li
								class="version"
								role="option"
								aria-selected={CHARACTER_MANAGER.version.id === ver.id}
								class:selected={CHARACTER_MANAGER.version.id === ver.id}
								tabindex="0"
								onclick={() => selectVersion(char, ver)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') selectVersion(char, ver);
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
				onclick={createNewCharacter}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') createNewCharacter();
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

	.version.selected {
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
