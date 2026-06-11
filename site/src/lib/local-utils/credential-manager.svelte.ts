import { browser } from '$app/environment';
import { credentialStore } from './credential-store.svelte';

class CredentialManager {
	public get isLogedIn(): boolean {
		return credentialStore.roles.includes('user');
	}

	public initFromStorage(): void {
		if (!browser) return;
		// reading roles triggers the getter which loads from localStorage
		void credentialStore.roles;
	}
}

export const CREDENTIAL_MANAGER = new CredentialManager();
