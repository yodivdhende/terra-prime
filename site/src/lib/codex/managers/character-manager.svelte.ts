import { CREDENTIAL_MANAGER } from "$lib/local-utils/credential-manager.svelte";

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
  ownerName: string;
  ownerId: number;
};

function emptyCharacter(): Character {
  const { id: ownerId, name: ownerName } = CREDENTIAL_MANAGER.credentials;
  if (ownerId == null) throw new Error('needs to be loged in');
  return {
    id: null,
    name: '',
    ownerName,
    ownerId,
  };
}

function emptyCharacterVersion(): CharacterVersion {
  return { id: null, name: '', skills: [], items: [], implants: [] };
}

export function createCharacterManager() {
  let character = $state<Character>(emptyCharacter());
  let version = $state<CharacterVersion>(emptyCharacterVersion());

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
