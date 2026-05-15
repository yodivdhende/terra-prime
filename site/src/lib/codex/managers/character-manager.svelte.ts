export type CharacterDraftSkill = { id: number; value: number };
export type CharacterDraftItem = { id: number; count: number };
export type CharacterVersion = {
  id: number | null;
  name: string;
  skills: CharacterDraftSkill[];
  items: CharacterDraftItem[];
  implants: number[];
};
export type Character = {
  id: number | null;
  name: string;
};

function emptyCharacter(): Character {
  return {
    id: null,
    name: '',
  };
}

function emptyCharacterVersion(): CharacterVersion {
  return { id: null, name: '', skills: [], items: [], implants: [] };
}

export function createCharacterManager() {
  let character = $state<Character>(emptyCharacter());
  let version = $state<CharacterVersion>(emptyCharacterVersion());

  $effect(() => {
    console.log('settingCharacter', $state.snapshot(character))
  })

  $effect(() => {
    console.log('settingVersion', $state.snapshot(version));
  })

  const ready = $derived.by(() => {
    if (character.name.trim().length <= 0) return false;
    if (version.name.trim().length <= 0) return false;
    return true;
  });

  const isNewCharacter = $derived(character.id === null);
  const isNewVersion = $derived(version.id === null);

  function reset() {
    character = emptyCharacter();
    version = emptyCharacterVersion();
  }

  return {
    get character() { return character; },
    set character(next: Character) { character = next },
    get version() { return version; },
    set version(next: CharacterVersion) { version = next },
    get ready() { return ready; },
    get isNewCharacter() { return isNewCharacter; },
    get isNewVersion() { return isNewVersion; },
    reset,
  };
}

export type CharacterManager = ReturnType<typeof createCharacterManager>;
