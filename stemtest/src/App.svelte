<script lang="ts">
	import companiesData from './lib/stemtest-companies.json';
	import questionsData from './lib/stemtest-questions.json';
	import './lib/reset.css';
	import './lib/stemtest.css';
	import IntroPanel from './lib/IntroPanel.svelte';
	import QuizPanel from './lib/QuizPanel.svelte';
	import QuizPanelFrame from './lib/QuizPanelFrame.svelte';
	import ResultPanel from './lib/ResultPanel.svelte';

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

	const ALL_QUESTIONS = questionsData as { text: string; weights: Partial<Record<Company, number>> }[];
	const QUIZ_SIZE = 10;

	function pickRandomQuestions() {
		const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, QUIZ_SIZE);
	}

	let questions = $state<{ text: string; weights: Partial<Record<Company, number>> }[]>([]);
	let currentIndex = $state(0);
	let answers = $state<(Answer | null)[]>(Array(QUIZ_SIZE).fill(null));
	let selectedAnswer = $state<Answer | null>(null);
	let phase = $state<'intro' | 'quiz' | 'result'>('intro');
	let result = $state<Company | null>(null);

	function startQuiz() {
		questions = pickRandomQuestions();
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

		if (currentIndex < questions.length - 1) {
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
			const weights = questions[i].weights;
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
		answers = Array(QUIZ_SIZE).fill(null);
		selectedAnswer = null;
		currentIndex = 0;
		phase = 'intro';
		result = null;
	}

	const progress = $derived(Math.round(((currentIndex + 1) / QUIZ_SIZE) * 100));

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
		<IntroPanel onStart={startQuiz} />
	{/if}

	{#if phase === 'quiz'}
		<QuizPanelFrame {currentIndex} quizSize={QUIZ_SIZE} {progress}>
			<QuizPanel
				{questions}
				{currentIndex}
				quizSize={QUIZ_SIZE}
				{selectedAnswer}
				answers={ANSWERS}
				onSelectAnswer={selectAnswer}
				onNext={nextQuestion}
				onPrev={prevQuestion}
			/>
		</QuizPanelFrame>
	{/if}

	{#if phase === 'result' && result}
		<ResultPanel company={COMPANIES[result]} onRestart={restartQuiz} />
	{/if}
</main>

<style>
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


</style>
