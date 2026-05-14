import { browser } from "$app/environment";
import type { UserRole } from "$lib/types/roles";

const storageKey = 'active-roles';
const nameStorageKey = 'active-name';

function createCredentialManager() {
  let _roles: UserRole[] = $state([]);
  let _name: string = $state('');
  const _isLogedIn: boolean = $derived(_roles.length > 0);

  function initFromStorage() {
    if (document.cookie.includes('session-token') === false) {
      clearUserCredentials();
      return;
    }

    const rolesString = window.localStorage.getItem(storageKey);
    const name = window.localStorage.getItem(nameStorageKey);

    if (rolesString != null) _roles = JSON.parse(rolesString);
    if (name != null) _name = name;
  }



  function clearUserCredentials() {
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(nameStorageKey)
  }

  return {
    get roles(): UserRole[] {
      if (_roles.length > 0) return _roles;
      if (browser) initFromStorage();
      return _roles;
    },
    set roles(value: UserRole[]) {
      if (browser) localStorage.setItem(storageKey, JSON.stringify(value));
      _roles = value;
    },
    get name(): string {
      if (_name) return _name;
      if (browser) initFromStorage();
      return _name;
    },
    set name(value: string) {
      if (browser) localStorage.setItem(nameStorageKey, value);
      _name = value;
    },
    get isLogedIn(): boolean {
      return _isLogedIn;
    }
  };
}

export const CREDENTIAL_MANAGER = createCredentialManager();
