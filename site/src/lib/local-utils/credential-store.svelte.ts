import { browser } from "$app/environment";
import type { UserRole } from "$lib/types/roles";

class CredentialStorage {
	private _roles: UserRole[] = $state([]);
	private _name: string = $state('');
	private storageKey = 'active-roles';
	private nameStorageKey = 'active-name';

	public get roles(): UserRole[] {
		if (this._roles.length > 0) return this._roles;
		if (browser) {
			if (document.cookie.includes('session-token') === false) this.cleareUserRoles();
			const storageValueString = window.localStorage.getItem(this.storageKey)
			if (storageValueString) return JSON.parse(storageValueString);
		}
		return this._roles;
	}

	public set roles(value: UserRole[]) {
		if (browser) localStorage.setItem('active-roles', JSON.stringify(value));
		this._roles = value;
	}

	public get name(): string {
		if (this._name) return this._name;
		if (browser) return window.localStorage.getItem(this.nameStorageKey) ?? '';
		return this._name;
	}

	public set name(value: string) {
		if (browser) localStorage.setItem(this.nameStorageKey, value);
		this._name = value;
	}

	private cleareUserRoles() {
		window.localStorage.removeItem(this.storageKey);
	}
}
export const credentialStore = new CredentialStorage();
