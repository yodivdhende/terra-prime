<script lang="ts">
	import RegisterStepEvents from './register-step-events.svelte';
	import RegisterStepCharacters from './register-step-characters.svelte';

	type Step = { id: number; label: string };

	const steps: Step[] = [
		{ id: 0, label: 'events' },
		{ id: 1, label: 'characters' },
		{ id: 2, label: 'create character' },
		{ id: 3, label: 'confirm' }
	];

	let currentStep = $state(0);
	let selectedEventId = $state<number | null>(null);
	let selectedCharacterId = $state<number | null>(null);

	const canAdvance = $derived(
		currentStep === 0 ? selectedEventId !== null :
		currentStep === 1 ? selectedCharacterId !== null :
		currentStep < steps.length - 1
	);

	function next() {
		if (!canAdvance) return;
		// skip "create character" step when a character is already selected
		if (currentStep === 1) {
			currentStep = 3;
		} else {
			currentStep++;
		}
	}

	function back() {
		if (currentStep === 3 && selectedCharacterId !== null) {
			currentStep = 1;
		} else if (currentStep > 0) {
			currentStep--;
		}
	}
</script>

<div class="register">
	<nav class="steps">
		{#each steps as step (step.id)}
			<span class="step" class:active={step.id === currentStep} class:done={step.id < currentStep}>
				{step.label}
			</span>
			{#if step.id < steps.length - 1}
				<span class="sep">›</span>
			{/if}
		{/each}
	</nav>

	<div class="content">
		{#if currentStep === 0}
			<RegisterStepEvents bind:selectedEventId />
		{:else if currentStep === 1}
			<RegisterStepCharacters
				bind:selectedCharacterId
				selectedEventId={selectedEventId!}
				oncreatenew={() => { currentStep = 2; }}
			/>
		{:else if currentStep === 2}
			<div class="placeholder">
				<p class="label">step 3 — create a character</p>
				<p class="hint">placeholder: character creator form</p>
			</div>
		{:else if currentStep === 3}
			<div class="placeholder">
				<p class="label">step 4 — confirm registration</p>
				<p class="hint">placeholder: final registration summary</p>
			</div>
		{/if}
	</div>

	<footer>
		<button onclick={back} disabled={currentStep === 0}>back</button>
		<button onclick={next} disabled={!canAdvance}>next</button>
	</footer>
</div>

<style>
	.register {
		display: flex;
		flex-direction: column;
		height: 100%;
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--color-main);
	}

	.steps {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 1rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
		font-size: 0.7rem;
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
		overflow-y: auto;
		padding: 1.25rem;
	}

	.placeholder {
		border: 1px dashed color-mix(in srgb, var(--color-accent) 25%, transparent);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.label {
		font-size: 0.8rem;
		color: var(--color-accent);
		opacity: 0.8;
	}

	.hint {
		font-size: 0.7rem;
		opacity: 0.4;
	}

	footer {
		display: flex;
		justify-content: space-between;
		padding: 0.6rem 1rem;
		border-top: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
	}

	button {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		padding: 0.3rem 0.75rem;
		background: transparent;
		color: var(--color-main);
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		cursor: pointer;
		transition:
			border-color 0.15s,
			color 0.15s;
	}

	button:hover:not(:disabled) {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	button:disabled {
		opacity: 0.25;
		cursor: default;
	}
</style>
