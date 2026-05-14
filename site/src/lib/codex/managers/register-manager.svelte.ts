export type CharacterDraftSkill = { id: number; value: number };
export type CharacterDraftItem = { id: number; count: number };
export type CharacterDraft = {
	name: string;
	skills: CharacterDraftSkill[];
	items: CharacterDraftItem[];
	implants: number[];
};

const STEPS = [
	{ id: 0, label: 'events' },
	{ id: 1, label: 'characters' },
	{ id: 2, label: 'create character' },
	{ id: 3, label: 'confirm' }
] as const;

function createRegisterManager() {
	let currentStep = $state(0);
	let selectedEventId = $state<number | null>(null);
	let selectedCharacterId = $state<number | null>(null);
	let selectedVersionId = $state<number | null>(null);
	let characterDraft = $state<CharacterDraft>({ name: '', skills: [], items: [], implants: [] });

	const draftReady = $derived(characterDraft.name.trim().length > 0);

	const canAdvance = $derived(
		currentStep === 0 ? selectedEventId !== null :
		currentStep === 1 ? selectedCharacterId !== null :
		currentStep === 2 ? draftReady :
		currentStep < STEPS.length - 1
	);

	const isNewCharacter = $derived(selectedCharacterId === null);

	function next() {
		if (!canAdvance) return;
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

	function selectEvent(id: number) {
		selectedEventId = id;
	}

	function selectCharacter(charId: number, versionId: number | null) {
		selectedCharacterId = charId;
		selectedVersionId = versionId;
	}

	function preselectCharacter(charId: number) {
		selectedCharacterId = charId;
	}

	function clearCharacter() {
		selectedCharacterId = null;
		selectedVersionId = null;
	}

	function goToCreateCharacter() {
		currentStep = 2;
	}

	function reset() {
		currentStep = 0;
		selectedEventId = null;
		selectedCharacterId = null;
		selectedVersionId = null;
		characterDraft = { name: '', skills: [], items: [], implants: [] };
	}

	return {
		get steps() { return STEPS; },
		get currentStep() { return currentStep; },
		get selectedEventId() { return selectedEventId; },
		get selectedCharacterId() { return selectedCharacterId; },
		get selectedVersionId() { return selectedVersionId; },
		get characterDraft() { return characterDraft; },
		get canAdvance() { return canAdvance; },
		get isNewCharacter() { return isNewCharacter; },
		next,
		back,
		selectEvent,
		selectCharacter,
		preselectCharacter,
		clearCharacter,
		goToCreateCharacter,
		reset,
	};
}

export const REGISTER_MANAGER = createRegisterManager();
