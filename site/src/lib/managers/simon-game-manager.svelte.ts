/**
 * Client-side state machine for the Simon Says minigame.
 *
 *     boot -> login -> connecting -> [briefing] -> playback -> input
 *                ^          |                          ^         |
 *                \----------/ (lookup error)            \--------/
 *                                                  round-clear -> playback
 *                                                  round-failed -> playback (streak resets)
 *                                                  win (streak reaches WIN_STREAK) -> login
 *
 * Ticked from a `requestAnimationFrame` loop in `+page.svelte` via `tick(delta, now)`,
 * mirroring `minigames/simon-says/simon/game.py`'s `update(delta, now)` — the same
 * timing model, translated from a 60 FPS clock to rAF deltas. Unlike the Python
 * version, the network call here is a plain `fetch`, so there's no need for the
 * background-thread/queue dance `game.py` used to keep the loop non-blocking.
 */

import { PAD_IDS, type ActiveCharacterInfo, type AmbiguousCandidate, type PadId } from '$lib/games/simon/types';

export type SimonState =
	| 'boot'
	| 'login'
	| 'connecting'
	| 'briefing'
	| 'playback'
	| 'input'
	| 'round-clear'
	| 'round-failed'
	| 'win';

const WIN_STREAK = 3;

const PLAYBACK_ON_MAX = 600;
const PLAYBACK_ON_MIN = 220;
const PLAYBACK_RAMP = 28;
const PLAYBACK_GAP_RATIO = 0.4;
const PLAYBACK_LEAD_IN = 700;

const PLAYER_FLASH = 180;
const ROUND_CLEAR_HOLD = 800;
const ROUND_FAILED_FLASH = 400;
const ROUND_FAILED_HOLD = 900;

const INPUT_TIME_BASE = 2500;
const INPUT_TIME_PER_STEP = 900;

const KEY_MAP: Record<string, PadId> = {
	u: 'UP',
	ArrowUp: 'UP',
	d: 'DOWN',
	ArrowDown: 'DOWN',
	l: 'LEFT',
	ArrowLeft: 'LEFT',
	r: 'RIGHT',
	ArrowRight: 'RIGHT'
};

function rollSequence(length: number): PadId[] {
	const sequence: PadId[] = [];
	for (let i = 0; i < length; i++) {
		sequence.push(PAD_IDS[Math.floor(Math.random() * PAD_IDS.length)]);
	}
	return sequence;
}

export function createSimonGameManager() {
	let state = $state<SimonState>('boot');
	let stateElapsed = $state(0);

	let nameInput = $state('');
	let lookupError = $state<string | null>(null);
	let candidates = $state<AmbiguousCandidate[]>([]);

	let character = $state<ActiveCharacterInfo | null>(null);
	let sequenceLength = $state(0);

	let sequence: PadId[] = [];
	let inputIndex = $state(0);
	let streak = $state(0);
	let failedPad = $state<PadId | null>(null);

	let litPad = $state<PadId | null>(null);
	let litUntil = 0;

	let playbackIndex = 0;
	let playbackTimer = 0;

	let inputDeadline = 0;
	let inputRemaining = $state(0);

	function enter(next: SimonState) {
		state = next;
		stateElapsed = 0;
	}

	function light(pad: PadId, now: number, duration: number) {
		litPad = pad;
		litUntil = now + duration;
	}

	function isLit(now: number): boolean {
		return litUntil > now;
	}

	function skipBoot() {
		if (state === 'boot') enter('login');
	}

	async function submitName(name: string, characterId?: number) {
		const trimmed = name.trim();
		if (!trimmed) return;
		nameInput = trimmed;
		lookupError = null;
		candidates = [];
		enter('connecting');

		try {
			const response = await fetch('/games/simon/lookup', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: trimmed, characterId })
			});
			const data = await response.json();

			if (!response.ok) {
				if (data.error === 'ambiguous') {
					candidates = data.candidates ?? [];
					lookupError = 'ambiguous';
				} else {
					lookupError = data.error ?? 'internal';
				}
				enter('login');
				return;
			}

			character = data.character;
			sequenceLength = data.sequenceLength;
			enter('briefing');
		} catch {
			lookupError = 'network';
			enter('login');
		}
	}

	function startRun() {
		streak = 0;
		failedPad = null;
		nextRound();
	}

	function nextRound() {
		sequence = rollSequence(sequenceLength);
		playbackIndex = 0;
		playbackTimer = -PLAYBACK_LEAD_IN;
		inputIndex = 0;
		enter('playback');
	}

	function playbackOnMs(): number {
		return Math.max(PLAYBACK_ON_MIN, PLAYBACK_ON_MAX - streak * PLAYBACK_RAMP);
	}

	function inputBudgetMs(): number {
		return INPUT_TIME_BASE + INPUT_TIME_PER_STEP * sequence.length;
	}

	function handlePad(pad: PadId, now: number) {
		if (state === 'boot') {
			skipBoot();
			return;
		}
		if (state === 'login' && lookupError) {
			// A stray keypress on the pads before a lookup shouldn't do anything.
			return;
		}
		if (state !== 'input') return;

		light(pad, now, PLAYER_FLASH);

		if (pad !== sequence[inputIndex]) {
			failedPad = pad;
			streak = 0;
			enter('round-failed');
			return;
		}

		inputIndex += 1;
		if (inputIndex >= sequence.length) {
			streak += 1;
			enter(streak >= WIN_STREAK ? 'win' : 'round-clear');
		}
	}

	function handleKey(key: string, now: number) {
		if (key === 'Enter') {
			if (state === 'boot') return skipBoot();
			if (state === 'briefing') return startRun();
			if (state === 'win') return restart();
			return; // 'round-clear'/'round-failed' auto-advance via tick()
		}
		const pad = KEY_MAP[key];
		if (pad) handlePad(pad, now);
	}

	function updatePlayback(delta: number, now: number) {
		const onMs = playbackOnMs();
		const stepMs = onMs + onMs * PLAYBACK_GAP_RATIO;

		playbackTimer += delta;
		while (playbackTimer >= 0 && playbackIndex < sequence.length) {
			light(sequence[playbackIndex], now, onMs);
			playbackIndex += 1;
			playbackTimer -= stepMs;
		}

		if (playbackIndex >= sequence.length && playbackTimer >= 0) {
			inputIndex = 0;
			inputDeadline = inputBudgetMs();
			inputRemaining = inputDeadline;
			enter('input');
		}
	}

	function tick(delta: number, now: number) {
		stateElapsed += delta;

		if (state === 'playback') {
			updatePlayback(delta, now);
		} else if (state === 'input') {
			inputRemaining = Math.max(0, inputDeadline - stateElapsed);
			if (inputRemaining <= 0) {
				failedPad = null;
				streak = 0;
				enter('round-failed');
			}
		} else if (state === 'round-clear') {
			if (stateElapsed >= ROUND_CLEAR_HOLD) nextRound();
		} else if (state === 'round-failed') {
			if (stateElapsed >= ROUND_FAILED_FLASH + ROUND_FAILED_HOLD) nextRound();
		}
	}

	function restart() {
		character = null;
		sequenceLength = 0;
		streak = 0;
		lookupError = null;
		candidates = [];
		enter('login');
	}

	return {
		get state() {
			return state;
		},
		get stateElapsed() {
			return stateElapsed;
		},
		get nameInput() {
			return nameInput;
		},
		get lookupError() {
			return lookupError;
		},
		get candidates() {
			return candidates;
		},
		get character() {
			return character;
		},
		get sequenceLength() {
			return sequenceLength;
		},
		get sequenceCount() {
			return sequence.length;
		},
		get inputIndex() {
			return inputIndex;
		},
		get streak() {
			return streak;
		},
		get winStreak() {
			return WIN_STREAK;
		},
		get failedPad() {
			return failedPad;
		},
		get litPad() {
			return litPad;
		},
		get inputRemaining() {
			return inputRemaining;
		},
		get inputBudget() {
			return inputDeadline;
		},
		isLit,
		skipBoot,
		submitName,
		startRun,
		handleKey,
		handlePad,
		tick,
		restart
	};
}

export type SimonGameManager = ReturnType<typeof createSimonGameManager>;
