import { CREDENTIAL_MANAGER } from "$lib/local-utils/credential-manager.svelte";
import type {
  CharacterVersionFull,
  VersionImplant,
  VersionItem,
  VersionSkill
} from '../../../routes/api/my/characters/versions/+server';

export type { CharacterVersionFull, VersionImplant, VersionItem, VersionSkill };

export type Character = {
  id: number | null;
  name: string;
  ownerName: string;
  ownerId: number;
  backstoryId?: string | null;
  implantLimit?: number;
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

function emptyCharacterVersion(): CharacterVersionFull {
  return { id: null, characterId: 0, name: '', skills: [], items: [], implants: [], events: [], company: null };
}

export function createCharacterManager() {
  let character = $state<Character>(emptyCharacter());
  let version = $state<CharacterVersionFull>(emptyCharacterVersion());

  const ready = $derived.by(() => {
    if (character.name.trim().length <= 0) return false;
    if (version.name.trim().length <= 0) return false;
    if (version.company == null) return false;
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
    set version(next: CharacterVersionFull) { version = next },
    get ready() { return ready; },
    get isNewCharacter() { return isNewCharacter; },
    get isNewVersion() { return isNewVersion; },
    reset,
  };
}

export type CharacterManager = ReturnType<typeof createCharacterManager>;
