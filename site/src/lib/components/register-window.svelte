<script lang="ts">
	import { type CodexWindow } from '$lib/managers/window-manager.svelte';
	import {
		createRegisterManager,
		type RegisterManager
	} from '$lib/managers/register-manager.svelte';
	import RegisterStepEvents from './register-step-events.svelte';
	import RegisterStepCharacters from './register-step-characters.svelte';
	import RegisterStepCreateCharacter from './register-step-create-character.svelte';
	import RegisterStepConfirm from './register-step-confirm.svelte';
	import {
		createCharacterManager,
		type CharacterManager
	} from '$lib/managers/character-manager.svelte';

	let { window: _window }: { window: CodexWindow } = $props();

	const CHARACTER_MANAGER: CharacterManager = createCharacterManager();
	const REGISTER_MANAGER: RegisterManager = createRegisterManager(CHARACTER_MANAGER);
</script>

<div class="register">
	<nav class="steps">
		{#each REGISTER_MANAGER.steps as step (step.id)}
			<span
				class="step"
				class:active={step.id === REGISTER_MANAGER.currentStep}
				class:done={step.id < REGISTER_MANAGER.currentStep}
			>
				{step.label}
			</span>
			{#if step.id < REGISTER_MANAGER.steps.length - 1}
				<span class="sep">›</span>
			{/if}
		{/each}
	</nav>

	<div class="content">
		{#if REGISTER_MANAGER.currentStep === 0}
			<RegisterStepEvents {REGISTER_MANAGER} />
		{:else if REGISTER_MANAGER.currentStep === 1}
			<RegisterStepCharacters {REGISTER_MANAGER} {CHARACTER_MANAGER} />
		{:else if REGISTER_MANAGER.currentStep === 2}
			<RegisterStepCreateCharacter {REGISTER_MANAGER} {CHARACTER_MANAGER} />
		{:else if REGISTER_MANAGER.currentStep === 3}
			<RegisterStepConfirm {REGISTER_MANAGER} {CHARACTER_MANAGER} />
		{/if}
	</div>

	<footer>
		<button
			class="btn"
			onclick={REGISTER_MANAGER.back}
			disabled={REGISTER_MANAGER.currentStep === 0}>back</button
		>
		<button class="btn" onclick={REGISTER_MANAGER.next} disabled={!REGISTER_MANAGER.canAdvance}
			>next</button
		>
	</footer>
</div>

<style>
	.register {
		display: flex;
		flex-direction: column;
		height: 100%;
		font-family: var(--font-mono);
		font-size: 1.2em;
		color: var(--color-main);
	}

	.steps {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 1rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
		font-size: 0.7em;
		flex-wrap: wrap;
	}

	.step {
		opacity: 0.35;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		transition:
			opacity 0.15s,
			color 0.15s;
	}

	.step.done {
		opacity: 0.5;
	}

	.step.active {
		opacity: 1;
		color: var(--color-accent);
	}

	.sep {
		opacity: 0.2;
	}

	.content {
		flex: 1;
		overflow-y: hidden;
		padding: 1.25rem;
	}

	footer {
		display: flex;
		justify-content: space-between;
		padding: 0.6rem 1rem;
		border-top: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
	}
</style>
