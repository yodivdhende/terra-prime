import { browser } from "$app/environment";
import type { UserRole } from "$lib/types/roles";

const storageKey = 'active-roles';
const nameStorageKey = 'active-name';

function createCredentialManager() {
  let _roles: UserRole[] = $state([]);
  let _name: string = $state('');
  const _isLogedIn: boolean = $derived(_roles.length > 0);

  function clearUserRoles() {
    window.localStorage.removeItem(storageKey);
  }

  function isLogedIn() {
    return document.cookie.includes('session-token') !== false;
  }

  return {
    get roles(): UserRole[] {
      if (_roles.length > 0) return _roles;
      if (browser) {
        if (document.cookie.includes('session-token') === false) clearUserRoles();
        const storageValueString = window.localStorage.getItem(storageKey);
        if (storageValueString) return JSON.parse(storageValueString);
      }
      return _roles;
    },
    set roles(value: UserRole[]) {
      if (browser) localStorage.setItem(storageKey, JSON.stringify(value));
      _roles = value;
    },
    get name(): string {
      if (_name) return _name;
      if (browser) return window.localStorage.getItem(nameStorageKey) ?? '';
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

export const CREDENTIAL_STORE = createCredentialManager();
