<script lang="ts">
	import Icon from '$lib/codex/components/icon.svelte';
	import itemLogo from '$lib/assets/images/ItemLogo.svg?raw';
	import implantLogo from '$lib/assets/images/ImplantLogo.svg?raw';

	import type {
		CharacterVersionFull,
		CharacterWithVersions,
		MyCharacterVersionsResponse
	} from '../../../routes/api/my/characters/versions/+server';
	import type { CharacterManager } from '../managers/character-manager.svelte';
	import type { RegisterManager } from '../managers/register-manager.svelte';
	import CharacterSkillGroups from './character-skill-groups.svelte';

	let {
		REGISTER_MANAGER,
		CHARACTER_MANAGER
	}: { REGISTER_MANAGER: RegisterManager; CHARACTER_MANAGER: CharacterManager } = $props();

	let characters = $state<CharacterWithVersions[]>([]);
	let loading = $state(true);

	$effect(() => {
		load();
	});

	async function load() {
		loading = true;
		const res = await fetch('/api/my/characters/versions');
		if (res.ok) {
			const data = (await res.json()) as MyCharacterVersionsResponse;
			characters = data.characters;
		}
		loading = false;
	}

	function selectVersion(char: CharacterWithVersions, ver: CharacterVersionFull) {
		CHARACTER_MANAGER.character = {
			id: char.id,
			name: char.name,
			ownerId: char.ownerId,
			ownerName: char.ownerName
		};
		CHARACTER_MANAGER.version = ver;
	}

	function createNewCharacter(): void {
		CHARACTER_MANAGER.reset();
		REGISTER_MANAGER.next();
	}

	function itemCount(ver: CharacterVersionFull): number {
		return ver.items.reduce((s, i) => s + i.count, 0);
	}

	function lastEvent(ver: CharacterVersionFull): { id: number; name: string } | undefined {
		return ver.events[ver.events.length - 1];
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
									{#if lastEvent(ver)}
										<span class="version-event">{lastEvent(ver)?.name}</span>
									{/if}
								</div>
								<div class="version-stats">
									<span class="stat">
										<CharacterSkillGroups skills={ver.skills} />
									</span>
									<span class="stat">
										<Icon src={itemLogo} color="white" tooltip="Items" />
										{itemCount(ver)}
									</span>
									<span class="stat">
										<Icon src={implantLogo} color="white" tooltip="Implants" />
										{ver.implants.length}
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

	.version-event {
		font-size: 0.62rem;
		opacity: 0.5;
		margin-left: auto;
		letter-spacing: 0.03em;
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
