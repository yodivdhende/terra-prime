<script lang="ts">
	type Answer = -2 | -1 | 0 | 1 | 2;

	let {
		currentIndex,
		quizSize,
		selectedAnswer,
		onNext,
		onPrev
	}: {
		currentIndex: number;
		quizSize: number;
		selectedAnswer: Answer | null;
		onNext: () => void;
		onPrev: () => void;
	} = $props();
</script>

<div class="nav-row">
	<button class="btn secondary" onclick={onPrev} disabled={currentIndex === 0}>
		[ VORIGE ]
	</button>
	<button class="btn" onclick={onNext} disabled={selectedAnswer === null}>
		{currentIndex === quizSize - 1 ? '[ ANALYSEER ]' : '[ VOLGENDE ]'}
	</button>
</div>

<style>
	.nav-row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 2rem 2rem;
	}

	.btn {
		background: transparent;
		border: 1px solid var(--accent);
		outline: none;
		color: white;
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.9rem;
		padding: 0.6rem 1.5rem;
		cursor: pointer;
		letter-spacing: 0.05em;
		border-radius: 3px;
		transition:
			background-color 0.15s,
			color 0.15s;
	}

	.btn:hover:not(:disabled) {
		background-color: var(--accent);
		color: black;
	}

	.btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.btn.secondary {
		border-color: var(--border-dim);
		color: var(--text-dim);
	}

	.btn.secondary:hover {
		background-color: var(--hover-bg);
		color: white;
	}

	@media (max-width: 500px) {
		.nav-row {
			flex-direction: column-reverse;
			padding: 1rem 1.25rem 1.25rem;
		}
	}
</style>
