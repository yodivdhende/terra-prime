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
		credentialStore.initFromStorage();
	}

	public async logout(): Promise<void> {
		await credentialStore.logout();
	}
}

export const CREDENTIAL_MANAGER = new CredentialManager();
