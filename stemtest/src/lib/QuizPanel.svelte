<script lang="ts">
	type Answer = -2 | -1 | 0 | 1 | 2;

	let {
		questions,
		currentIndex,
		quizSize,
		selectedAnswer,
		answers,
		onSelectAnswer,
		onNext,
		onPrev
	}: {
		questions: { text: string }[];
		currentIndex: number;
		quizSize: number;
		selectedAnswer: Answer | null;
		answers: { label: string; value: Answer }[];
		onSelectAnswer: (value: Answer) => void;
		onNext: () => void;
		onPrev: () => void;
	} = $props();
</script>

<div class="content">
	<p class="question">{questions[currentIndex].text}</p>
	<div class="answers">
		{#each answers as opt, i}
			<button
				class="answer-btn"
				class:selected={selectedAnswer === opt.value}
				onclick={() => onSelectAnswer(opt.value)}
				onfocus={() => onSelectAnswer(opt.value)}
			>
				<span class="cursor">&gt;</span><span class="num">{i + 1}.</span> {opt.label}
			</button>
		{/each}
	</div>
	<div class="nav-row">
		<button class="btn secondary" onclick={onPrev} disabled={currentIndex === 0}>
			[ VORIGE ]
		</button>
		<button class="btn" onclick={onNext} disabled={selectedAnswer === null}>
			{currentIndex === quizSize - 1 ? '[ ANALYSEER ]' : '[ VOLGENDE ]'}
		</button>
	</div>
</div>

<style>
	.content {
		padding: 2rem;
	}

	.question {
		font-size: 1.1rem;
		line-height: 1.6;
		margin-bottom: 2rem;
		color: white;
	}

	.answers {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	.answer-btn {
		background: transparent;
		border: none;
		outline: none;
		color: var(--text-dim);
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.9rem;
		padding: 0.3rem 0;
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: color 0.1s;
	}

	.answer-btn .cursor {
		display: inline-block;
		width: 1.2em;
		color: var(--accent);
		opacity: 0;
		transition: opacity 0.1s;
	}

	.answer-btn.selected .cursor {
		opacity: 1;
	}

	.answer-btn .num {
		display: inline-block;
		width: 1.5em;
		color: var(--text-muted);
		transition: color 0.1s;
	}

	.answer-btn:hover,
	.answer-btn:focus-visible {
		color: white;
	}

	.answer-btn:hover .num,
	.answer-btn:focus-visible .num {
		color: var(--accent);
	}

	.answer-btn.selected {
		color: var(--accent);
	}

	.answer-btn.selected .num {
		color: var(--accent);
	}

	.nav-row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
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
		.content {
			padding: 1.25rem;
		}

		.question {
			font-size: 1rem;
		}

		.nav-row {
			flex-direction: column-reverse;
		}
	}
</style>
