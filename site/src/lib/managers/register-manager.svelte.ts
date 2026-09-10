import type { StringLarpEvent } from '$lib/db/event.repo';
import type { GoogleForm } from '$lib/services/google-form-service';
import {
  type CharacterManager
} from './character-manager.svelte';

const STEPS = [
  { id: 0, label: 'events' },
  { id: 1, label: 'characters' },
  { id: 2, label: 'create character' },
  { id: 3, label: 'confirm' }
] as const;

function allRequiredAnswered(form: GoogleForm, answers: Record<string, string | string[]>): boolean {
  for (const item of form.items ?? []) {
    if (item.pageBreakItem) continue;
    if (item.questionItem?.question?.required) {
      const qid = item.questionItem.question.questionId;
      if (!qid) continue;
      const answer = answers[qid];
      if (answer === undefined || answer === null) return false;
      if (Array.isArray(answer) && answer.length === 0) return false;
      if (typeof answer === 'string' && answer.trim() === '') return false;
    }
    if (item.questionGroupItem?.questions) {
      for (const gridQ of item.questionGroupItem.questions) {
        if (gridQ.required) {
          const qid = gridQ.questionId;
          if (!qid) continue;
          const answer = answers[qid];
          if (answer === undefined || answer === null) return false;
          if (typeof answer === 'string' && answer.trim() === '') return false;
        }
      }
    }
  }
  return true;
}

export function createRegisterManager(characterManager: CharacterManager) {
  let currentStep = $state(0);
  let events: StringLarpEvent[] = $state([]);
  let selectedEventId = $state<number | null>(null);
  const selectedEvent = $derived(events.find(e => e.id === selectedEventId));
  const selectedFormId = $derived(selectedEvent?.formId ?? null);
  let selectedCharacterId = $state<number | null>(null);
  let selectedVersionId = $state<number | null>(null);
  let editMode = $state(false);

  let form = $state<GoogleForm | null>(null);
  let formAnswers = $state<Record<string, string | string[]>>({});
  let formLoading = $state(false);
  let formError = $state(false);

  let couponCode = $state('');
  let baseBudget = $state(0);
  let budgetLoading = $state(false);
  let couponValue = $state(0);
  let couponStatus = $state<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const availableBudget = $derived(baseBudget + (couponStatus === 'valid' ? couponValue : 0));

  const canAdvance = $derived.by(() => {
    if (currentStep === 0) {
      if (selectedEventId === null) return false;
      if (!selectedFormId) return true;
      if (formLoading || formError || !form) return false;
      return allRequiredAnswered(form, formAnswers);
    }
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
    const event = events.find(e => e.id === id);
    const formId = event?.formId ?? null;
    resetForm();
    couponCode = '';
    baseBudget = 0;
    couponValue = 0;
    couponStatus = 'idle';
    if (formId) {
      formLoading = true;
      fetch(`/api/forms/${formId}`)
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then((data: GoogleForm) => { form = data; formLoading = false; })
        .catch(() => { formError = true; formLoading = false; });
    }
  }

  function setAnswer(qid: string, value: string | string[]) {
    formAnswers[qid] = value;
  }

  function toggleCheckbox(qid: string, option: string) {
    const current = (formAnswers[qid] as string[] | undefined) ?? [];
    if (current.includes(option)) {
      formAnswers[qid] = current.filter(v => v !== option);
    } else {
      formAnswers[qid] = [...current, option];
    }
  }

  function resetForm() {
    form = null;
    formAnswers = {};
    formLoading = false;
    formError = false;
  }

  async function loadBudget(characterId: number | null) {
    if (selectedEventId === null) return;
    budgetLoading = true;
    try {
      const eventRes = await fetch(`/api/events/${selectedEventId}`);
      if (!eventRes.ok) {
        baseBudget = 0;
        return;
      }
      const event: { budget?: number | null } = await eventRes.json();
      const base = event.budget ?? 0;
      if (characterId != null) {
        const extraRes = await fetch(`/api/events/${selectedEventId}/budget/characters/${characterId}`);
        baseBudget = extraRes.ok ? ((await extraRes.json()) as { budget: number }).budget : 0;
      } else {
        baseBudget = base;
      }
    } finally {
      budgetLoading = false;
    }
  }

  async function validateCoupon() {
    const code = couponCode.trim();
    if (!code || selectedEventId === null) {
      couponValue = 0;
      couponStatus = 'idle';
      return;
    }
    couponStatus = 'checking';
    try {
      const res = await fetch(`/api/my/events/${selectedEventId}/coupons/${encodeURIComponent(code)}`);
      const data: { valid: boolean; value: number } = res.ok
        ? await res.json()
        : { valid: false, value: 0 };
      couponValue = data.valid ? data.value : 0;
      couponStatus = data.valid ? 'valid' : 'invalid';
    } catch {
      couponValue = 0;
      couponStatus = 'invalid';
    }
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
    resetForm();
    couponCode = '';
    baseBudget = 0;
    couponValue = 0;
    couponStatus = 'idle';
    characterManager.reset();
  }

  return {
    get steps() { return STEPS; },
    get currentStep() { return currentStep; },
    get selectedEventId() { return selectedEventId; },
    get selectedFormId() { return selectedFormId; },
    get selectedCharacterId() { return selectedCharacterId; },
    get selectedVersionId() { return selectedVersionId; },
    get canAdvance() { return canAdvance; },
    get isNewCharacter() { return isNewCharacter; },
    get editMode() { return editMode; },
    get events() { return events },
    set events(value: StringLarpEvent[]) { events = value },
    get selectedEvent() { return selectedEvent ?? null },
    get form() { return form; },
    get formAnswers() { return formAnswers; },
    get formLoading() { return formLoading; },
    get formError() { return formError; },
    get couponCode() { return couponCode; },
    set couponCode(value: string) { couponCode = value; },
    get budget() { return baseBudget; },
    get budgetLoading() { return budgetLoading; },
    get availableBudget() { return availableBudget; },
    get couponValue() { return couponValue; },
    get couponStatus() { return couponStatus; },
    next,
    back,
    selectEvent,
    setAnswer,
    toggleCheckbox,
    resetForm,
    selectCharacter,
    preselectCharacter,
    clearCharacter,
    loadBudget,
    validateCoupon,
    reset,
  };
}
export type RegisterManager = ReturnType<typeof createRegisterManager>;
