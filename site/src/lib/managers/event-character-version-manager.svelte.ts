import type { CharacterVersionBare } from "$lib/db/character_version.repo";
import { getContext, setContext } from "svelte";

class EventCharacterVersionManager {
  public static CONTEXT_KEY = Symbol('EVENT_CHARACTER_VERSION_MANAGER_CONTEXT_KEY');
  public skills: CharacterVersionBare['skills'] = $state([]);
  public implants: CharacterVersionBare['implants'] = $state([]);
  public items: CharacterVersionBare['items'] = $state([]);

  public setCharacterVersion(character: CharacterVersionBare) {
    this.skills = character.skills;
    this.implants = character.implants;
    this.items = character.items;
  }

  public reset() {
    this.skills = [];
    this.implants = [];
    this.items = [];
  }
}

export function setEventCharacterVersionManager() {
  return setContext(EventCharacterVersionManager.CONTEXT_KEY, new EventCharacterVersionManager());
}

export function getEventCharacterVersionManager() {
  return getContext<EventCharacterVersionManager>(EventCharacterVersionManager.CONTEXT_KEY);
}
