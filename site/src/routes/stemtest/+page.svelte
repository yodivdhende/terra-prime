<script lang="ts">
	import companiesData from '$lib/assets/data/stemtest-companies.json';
	import questionsData from '$lib/assets/data/stemtest-questions.json';

	type Company = 'NEON_HAVEN' | 'AURION' | 'BIOSYNTH' | 'BLACKWATER' | 'VANTAGE' | 'LUMEN_VEIL';
	type Answer = -2 | -1 | 0 | 1 | 2;

	const ANSWERS: { label: string; value: Answer }[] = [
		{ label: 'Sterk Afwijkend', value: -2 },
		{ label: 'Afwijkend', value: -1 },
		{ label: 'Neutraal', value: 0 },
		{ label: 'Conform', value: 1 },
		{ label: 'Volledig Conform', value: 2 }
	];

	const COMPANIES = companiesData as Record<
		Company,
		{ name: string; domain: string; description: string; result: string }
	>;

	const QUESTIONS = questionsData as { text: string; weights: Partial<Record<Company, number>> }[];

	let currentIndex = $state(0);
	let answers = $state<(Answer | null)[]>(Array(QUESTIONS.length).fill(null));
	let selectedAnswer = $state<Answer | null>(null);
	let phase = $state<'intro' | 'quiz' | 'result'>('intro');
	let result = $state<Company | null>(null);

	function startQuiz() {
		phase = 'quiz';
		currentIndex = 0;
		selectedAnswer = null;
	}

	function selectAnswer(value: Answer) {
		selectedAnswer = value;
	}

	function nextQuestion() {
		if (selectedAnswer === null) return;
		answers[currentIndex] = selectedAnswer;

		if (currentIndex < QUESTIONS.length - 1) {
			currentIndex++;
			selectedAnswer = answers[currentIndex];
		} else {
			submitQuiz();
		}
	}

	function prevQuestion() {
		if (currentIndex > 0) {
			answers[currentIndex] = selectedAnswer;
			currentIndex--;
			selectedAnswer = answers[currentIndex];
		}
	}

	function submitQuiz() {
		const scores: Record<Company, number> = {
			NEON_HAVEN: 0,
			AURION: 0,
			BIOSYNTH: 0,
			BLACKWATER: 0,
			VANTAGE: 0,
			LUMEN_VEIL: 0
		};

		answers.forEach((answer, i) => {
			if (answer === null) return;
			const weights = QUESTIONS[i].weights;
			for (const [company, weight] of Object.entries(weights) as [Company, number][]) {
				scores[company] += answer * weight;
			}
		});

		result = (Object.entries(scores) as [Company, number][]).reduce((a, b) =>
			b[1] > a[1] ? b : a
		)[0];
		phase = 'result';
	}

	function restartQuiz() {
		answers = Array(QUESTIONS.length).fill(null);
		selectedAnswer = null;
		currentIndex = 0;
		phase = 'intro';
		result = null;
	}

	const progress = $derived(Math.round(((currentIndex + 1) / QUESTIONS.length) * 100));

	const answerValues = ANSWERS.map((a) => a.value);

	function handleKeydown(e: KeyboardEvent) {
		if (phase === 'intro') {
			if (e.key === 'Enter') startQuiz();
			return;
		}

		if (phase === 'result') {
			if (e.key === 'Enter' || e.key === 'Escape') restartQuiz();
			return;
		}

		if (phase === 'quiz') {
			if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
				e.preventDefault();
				const currentIdx = selectedAnswer === null ? -1 : answerValues.indexOf(selectedAnswer);
				if (e.key === 'ArrowUp') {
					selectedAnswer = answerValues[Math.max(0, currentIdx - 1)];
				} else {
					selectedAnswer = answerValues[Math.min(answerValues.length - 1, currentIdx + 1)];
				}
			} else if (e.key === 'Enter') {
				nextQuestion();
			} else if (e.key === 'Escape') {
				prevQuestion();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<main>
	{#if phase === 'intro'}
		<div class="panel intro-panel">
			<div class="header-bar">+++ [ TERRA PRIME FEDERATIE — STEM TEST PROTOCOL ] +++</div>
			<div class="content">
				<p class="system-msg">INITIALISEREN... VERBINDING BEVESTIGD</p>
				<p class="system-msg">PERSOONLIJKHEIDSPROFIEL ANALYSE V2.4.1</p>
				<br />
				<p>
					Uw antwoorden worden gebruikt om uw optimale plaatsing binnen de corporate structuur van
					Terra Prime te bepalen.
				</p>
				<br />
				<p>Beantwoord elke stelling eerlijk.</p>
				<p>Uw profiel wordt vergeleken met bestaande corporaties.</p>
				<p>Een match wordt gegarandeerd.</p>
				<br />
				<p class="warning">WAARSCHUWING: Resultaten zijn bindend.</p>
				<br />
				<button class="btn" onclick={startQuiz}>[ START ANALYSE ]</button>
			</div>
		</div>
	{/if}

	{#if phase === 'quiz'}
		<div class="panel quiz-panel">
			<div class="header-bar">
				+++ [ ANALYSE ACTIEF — VRAAG {currentIndex + 1} / {QUESTIONS.length} ] +++
			</div>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progress}%"></div>
			</div>
			<div class="content">
				<p class="question">{QUESTIONS[currentIndex].text}</p>
				<div class="answers">
					{#each ANSWERS as opt}
						<button
							class="answer-btn"
							class:selected={selectedAnswer === opt.value}
							onclick={() => selectAnswer(opt.value)}
							onfocus={() => selectAnswer(opt.value)}
						>
							<span class="cursor">&gt;</span>* {opt.label}
						</button>
					{/each}
				</div>
				<div class="nav-row">
					<button class="btn secondary" onclick={prevQuestion} disabled={currentIndex === 0}>
						[ VORIGE ]
					</button>
					<button class="btn" onclick={nextQuestion} disabled={selectedAnswer === null}>
						{currentIndex === QUESTIONS.length - 1 ? '[ ANALYSEER ]' : '[ VOLGENDE ]'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if phase === 'result' && result}
		{@const company = COMPANIES[result]}
		<div class="panel result-panel">
			<div class="header-bar">+++ [ CORPORATE MATCH: {company.name} ] +++</div>
			<div class="content">
				<p class="system-msg">ANALYSE VOLTOOID — PROFIEL GECLASSIFICEERD</p>
				<br />
				<p class="domain">DOMEIN: {company.domain}</p>
				<br />
				<p class="result-text">{company.result}</p>
				<br />
				<p class="description">{company.description}</p>
				<br />
				<button class="btn secondary" onclick={restartQuiz}>[ HERSTART ANALYSE ]</button>
			</div>
		</div>
	{/if}
</main>

<style>
	:root {
		--accent: #00cc00;
	}

	main {
		width: 100vw;
		min-height: 100vh;
		background-color: black;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Courier New', Courier, monospace;
		color: white;
		padding: 2rem 1rem;
		box-sizing: border-box;
		position: relative;
		overflow: hidden;
	}

	.panel {
		width: 100%;
		max-width: 720px;
		border: 2px solid var(--accent);
		box-shadow:
			var(--accent) 0 0 16px,
			var(--accent) 0 0 4px inset;
		background-color: #050505;
		overflow: hidden;
	}

	.header-bar {
		background-color: var(--accent);
		color: black;
		font-size: 0.75rem;
		font-weight: bold;
		padding: 0.4rem 1rem;
		letter-spacing: 0.05em;
	}

	.progress-bar {
		height: 3px;
		background-color: #222;
	}

	.progress-fill {
		height: 100%;
		background-color: var(--accent);
		transition: width 0.3s ease;
	}

	.content {
		padding: 2rem;
	}

	.system-msg {
		font-size: 0.75rem;
		color: #888;
		letter-spacing: 0.08em;
	}

	.warning {
		color: #cc4444;
		font-size: 0.85rem;
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
		color: #aaa;
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

	.answer-btn:hover,
	.answer-btn:focus-visible {
		color: white;
	}

	.answer-btn:hover .cursor,
	.answer-btn:focus-visible .cursor {
		opacity: 1;
	}

	.answer-btn.selected {
		color: var(--accent);
	}

	.answer-btn.selected .cursor {
		opacity: 1;
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
		border-color: #555;
		color: #aaa;
	}

	.btn.secondary:hover {
		background-color: #333;
		color: white;
	}

	.domain {
		font-size: 0.8rem;
		color: #888;
		letter-spacing: 0.1em;
	}

	.result-text {
		white-space: pre-line;
		line-height: 1.8;
		color: #ddd;
		font-size: 0.95rem;
		border-left: 2px solid var(--accent);
		padding-left: 1rem;
	}

	.description {
		font-size: 0.85rem;
		color: #777;
		line-height: 1.6;
		font-style: italic;
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

		.header-bar {
			font-size: 0.65rem;
		}
	}
</style>
