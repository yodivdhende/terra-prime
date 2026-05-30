<script lang="ts">
	import { onMount } from 'svelte';
	import type { Character, CharacterVersionFull } from '../managers/character-manager.svelte';
	import CompanySelect from '$lib/components/company-select.svelte';
	import BackstoryLink from '$lib/components/backstory-link.svelte';

	let {
		character = $bindable(),
		version = $bindable()
	}: {
		character: Character;
		version: CharacterVersionFull;
	} = $props();

	$inspect(character);
	$inspect(version);

	onMount(() => {
		if (version.name == false) version.name = 'Version 1';
	});
</script>

<label class="name-field">
	<span class="label">Character name</span>
	<input
		type="text"
		bind:value={character.name}
		placeholder="character name"
		required
		aria-invalid={character.name.trim().length === 0}
	/>
</label>
<label class="name-field">
	<span class="label">Version</span>
	<input
		type="text"
		bind:value={version.name}
		placeholder="character name"
		required
		aria-invalid={version.name.trim().length === 0}
	/>
</label>
<label class="name-field">
	<span class="label">Company</span>
	<CompanySelect bind:company={version.company} />
</label>
{#if character.id != null}
	<div class="name-field">
		<span class="label">Backstory</span>
		<BackstoryLink characterId={character.id} backstoryUrl={character.backstoryUrl} />
	</div>
{/if}

<style>
	.name-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.label {
		font-size: 0.6em;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.55;
	}

	.name-field input {
		font-family: var(--font-mono);
		font-size: 0.85em;
		background: transparent;
		color: var(--color-main);
		border: none;
		border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 35%, transparent);
		padding: 0.2rem 0;
		outline: none;
	}

	.name-field input:focus {
		border-bottom-color: var(--color-accent);
	}

	.name-field input[aria-invalid='true'] {
		border-bottom-color: color-mix(in srgb, #d95c5c 60%, transparent);
	}
</style>
