import { browser } from "$app/environment";
import type { UserRole } from "$lib/types/roles";

const storageKey = 'active-credentials';

export type Credentials = {
  roles: UserRole[];
  name: string;
  id: number | null;
};

function emptyCredentials(): Credentials {
  return { roles: [], name: '', id: null };
}

function createCredentialManager() {
  let _credentials: Credentials = $state(emptyCredentials());
  const _isLogedIn: boolean = $derived(_credentials.id != null);

  function persist() {
    window.localStorage.setItem(storageKey, JSON.stringify(_credentials));
  }

  function initFromStorage() {
    const stored = window.localStorage.getItem(storageKey);
    if (stored == null) return;

    const parsed: Credentials = JSON.parse(stored);
    _credentials = {
      roles: parsed.roles ?? [],
      name: parsed.name ?? '',
      id: parsed.id ?? null,
    };
  }

  function logout() {
    _credentials = emptyCredentials();
    window.localStorage.removeItem(storageKey);
  }

  return {
    get credentials(): Credentials {
      return _credentials;
    },
    set credentials(value: Credentials) {
      _credentials = value;
      if (browser) persist();
    },
    get isLogedIn(): boolean {
      return _isLogedIn;
    },
    initFromStorage,
    logout,
  };
}

export const CREDENTIAL_MANAGER = createCredentialManager();
