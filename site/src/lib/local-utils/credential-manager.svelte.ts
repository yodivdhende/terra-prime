import { browser } from '$app/environment';
import { credentialStore, type Credentials } from './credential-store.svelte';

class CredentialManager {
	public get isLogedIn(): boolean {
		return credentialStore.roles.includes('user');
	}

	public get credentials(): Credentials {
		return credentialStore.credentials;
	}

	public set credentials(value: Credentials) {
		credentialStore.credentials = value;
	}

	public initFromStorage(): void {
		if (!browser) return;
		void credentialStore.roles;
	}

	public logout(): void {
		credentialStore.clear();
	}
}

export const CREDENTIAL_MANAGER = new CredentialManager();
