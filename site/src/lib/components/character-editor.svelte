<script lang="ts">
	import { onMount } from 'svelte';
	import type { Character, CharacterVersionFull } from '$lib/managers/character-manager.svelte';
	import type { RegisterManager } from '$lib/managers/register-manager.svelte';
	import CompanySelect from '$lib/components/company-select.svelte';
	import RegisterCouponInput from './register-coupon-input.svelte';
	import { FEATURE_MANAGER } from '$lib/managers/feature-manager.svelte';

	let {
		character = $bindable(),
		version = $bindable(),
		REGISTER_MANAGER
	}: {
		character: Character;
		version: CharacterVersionFull;
		REGISTER_MANAGER?: RegisterManager;
	} = $props();

	onMount(() => {
		if (!version.name) version.name = 'Version 1';
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
{#if REGISTER_MANAGER && FEATURE_MANAGER.couponsEnabled}
	<RegisterCouponInput {REGISTER_MANAGER} />
{/if}

<style>
	.name-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		margin-bottom: 1em;
	}

	.label {
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
