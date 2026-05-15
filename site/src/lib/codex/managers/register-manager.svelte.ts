import {
  type CharacterManager
} from './character-manager.svelte';

const STEPS = [
  { id: 0, label: 'events' },
  { id: 1, label: 'characters' },
  { id: 2, label: 'create character' },
  { id: 3, label: 'confirm' }
] as const;

export function createRegisterManager(characterManager: CharacterManager) {
  let currentStep = $state(0);
  let selectedEventId = $state<number | null>(null);
  let selectedCharacterId = $state<number | null>(null);
  let selectedVersionId = $state<number | null>(null);
  let editMode = $state(false);

  const canAdvance = $derived.by(() => {
    if (currentStep === 0) return selectedEventId !== null;
    if (currentStep === 1) return true;
    if (currentStep === 2) return characterManager.ready;
    return currentStep < STEPS.length - 1;
  });

  const isNewCharacter = $derived(selectedCharacterId === null);

  function next() {
    if (!canAdvance) return;
    currentStep++;
  }

  function back() {
    if (currentStep === 3 && editMode) {
      currentStep = 2;
    } else if (currentStep === 3 && selectedCharacterId !== null) {
      currentStep = 1;
    } else if (currentStep === 2) {
      editMode = false;
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

  function reset() {
    currentStep = 0;
    selectedEventId = null;
    selectedCharacterId = null;
    selectedVersionId = null;
    characterManager.reset();
  }

  return {
    get steps() { return STEPS; },
    get currentStep() { return currentStep; },
    get selectedEventId() { return selectedEventId; },
    get selectedCharacterId() { return selectedCharacterId; },
    get selectedVersionId() { return selectedVersionId; },
    get canAdvance() { return canAdvance; },
    get isNewCharacter() { return isNewCharacter; },
    get editMode() { return editMode; },
    next,
    back,
    selectEvent,
    selectCharacter,
    preselectCharacter,
    clearCharacter,
    reset,
  };
}
export type RegisterManager = ReturnType<typeof createRegisterManager>;
