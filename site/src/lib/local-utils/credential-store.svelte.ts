import { browser } from '$app/environment';
import { localStorageKeys } from '$lib/managers/local-storage';

export type Credentials = { roles: string[]; name: string; id: number | null };

const DEFAULT: Credentials = { roles: [], name: '', id: null };

function createCredentialStore() {
  let _credentials = $state<Credentials>(DEFAULT);

  return {
    get roles(): string[] {
      return _credentials.roles;
    },
    get credentials(): Credentials {
      return _credentials;
    },
    set credentials(value: Credentials) {
      _credentials = value;
      if (browser) localStorage.setItem(localStorageKeys.activeUser, JSON.stringify(value));
    },
    init() {
      if (!browser) return;
      try {
        const raw = localStorage.getItem(localStorageKeys.activeUser);
        if (raw) _credentials = JSON.parse(raw);
      } catch (error) {
        console.error('init could not load', { error });
      }
    },
    clear() {
      _credentials = DEFAULT;
      if (browser) localStorage.removeItem(localStorageKeys.activeUser);
    }
  };
}

export const credentialStore = createCredentialStore();
