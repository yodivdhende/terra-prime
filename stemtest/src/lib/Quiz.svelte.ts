import companiesData from './stemtest-companies.json';
import questionsData from './stemtest-questions.json';

export type Company = 'NEON_HAVEN' | 'AURION' | 'BIOSYNTH' | 'BLACKWATER' | 'VANTAGE' | 'LUMEN_VEIL';
export type Answer = -2 | -1 | 0 | 1 | 2;
export type Phase = 'intro' | 'quiz' | 'result';

export type CompanyData = { name: string; domain: string; description: string; result: string };

export const ANSWERS: { label: string; value: Answer }[] = [
	{ label: 'Sterk Afwijkend', value: -2 },
	{ label: 'Afwijkend', value: -1 },
	{ label: 'Neutraal', value: 0 },
	{ label: 'Conform', value: 1 },
	{ label: 'Volledig Conform', value: 2 }
];

const QUIZ_SIZE = 10;

export type Question = { text: string; type?: 'voice' | 'camera'; weights: Partial<Record<Company, number>> };

const ALL_QUESTIONS = questionsData as Question[];
const COMPANIES = companiesData as Record<Company, CompanyData>;

export class Quiz {
	readonly quizSize = QUIZ_SIZE;
	readonly answers = ANSWERS;
	readonly companies = COMPANIES;

	questions = $state<Question[]>([]);
	currentIndex = $state(0);
	givenAnswers = $state<(Answer | null)[]>(Array(QUIZ_SIZE).fill(null));
	selectedAnswer = $state<Answer | null>(null);
	phase = $state<Phase>('intro');
	result = $state<Company | null>(null);

	progress = $derived(Math.round(((this.currentIndex + 1) / QUIZ_SIZE) * 100));
	currentQuestion = $derived(this.questions[this.currentIndex] ?? null);
	resultCompany = $derived(this.result ? COMPANIES[this.result] : null);

	start() {
		const voiceQuestions = ALL_QUESTIONS.filter(q => q.type === 'voice');
		const cameraQuestions = ALL_QUESTIONS.filter(q => q.type === 'camera');
		const regularQuestions = ALL_QUESTIONS.filter(q => q.type !== 'voice' && q.type !== 'camera');
		const shuffledRegular = regularQuestions.sort(() => Math.random() - 0.5);
		const randomVoice = voiceQuestions[Math.floor(Math.random() * voiceQuestions.length)];
		const randomCamera = cameraQuestions[Math.floor(Math.random() * cameraQuestions.length)];
		this.questions = [...shuffledRegular.slice(0, QUIZ_SIZE - 2), randomVoice, randomCamera];
		this.givenAnswers = Array(QUIZ_SIZE).fill(null);
		this.currentIndex = 0;
		this.selectedAnswer = null;
		this.result = null;
		this.phase = 'quiz';
	}

	selectAnswer(value: Answer) {
		this.selectedAnswer = value;
	}

	get isVoiceQuestion() {
		return this.currentQuestion?.type === 'voice';
	}

	next() {
		if (this.selectedAnswer === null) return;
		this.givenAnswers[this.currentIndex] = this.selectedAnswer;

		if (this.currentIndex < this.questions.length - 1) {
			this.currentIndex++;
			this.selectedAnswer = this.givenAnswers[this.currentIndex];
		} else {
			this.#submit();
		}
	}

	prev() {
		if (this.currentIndex === 0) return;
		this.givenAnswers[this.currentIndex] = this.selectedAnswer;
		this.currentIndex--;
		this.selectedAnswer = this.givenAnswers[this.currentIndex];
	}

	restart() {
		this.givenAnswers = Array(QUIZ_SIZE).fill(null);
		this.selectedAnswer = null;
		this.currentIndex = 0;
		this.result = null;
		this.phase = 'intro';
	}

	#submit() {
		const scores: Record<Company, number> = {
			NEON_HAVEN: 0,
			AURION: 0,
			BIOSYNTH: 0,
			BLACKWATER: 0,
			VANTAGE: 0,
			LUMEN_VEIL: 0
		};

		this.givenAnswers.forEach((answer, i) => {
			if (answer === null) return;
			for (const [company, weight] of Object.entries(this.questions[i].weights) as [Company, number][]) {
				scores[company] += answer * weight;
			}
		});

		this.result = (Object.entries(scores) as [Company, number][]).reduce((a, b) =>
			b[1] > a[1] ? b : a
		)[0];
		this.phase = 'result';
	}
}
