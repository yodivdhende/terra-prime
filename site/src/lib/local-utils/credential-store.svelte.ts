import { browser } from '$app/environment';
import { localStorageKeys } from '$lib/managers/local-storage';

export type Credentials = { roles: string[]; name: string; id: number | null };

const DEFAULT: Credentials = { roles: [], name: '', id: null };

function createCredentialStore() {
	let _credentials = $state<Credentials>(DEFAULT);
	let _loaded = false;

	function ensureLoaded() {
		if (_loaded || !browser) return;
		_loaded = true;
		try {
			const raw = localStorage.getItem(localStorageKeys.activeUser);
			if (raw) _credentials = JSON.parse(raw);
		} catch {
			/* ignore parse errors */
		}
	}

	return {
		get roles(): string[] {
			ensureLoaded();
			return _credentials.roles;
		},
		get credentials(): Credentials {
			ensureLoaded();
			return _credentials;
		},
		set credentials(value: Credentials) {
			_credentials = value;
			_loaded = true;
			if (browser) localStorage.setItem(localStorageKeys.activeUser, JSON.stringify(value));
		},
		clear() {
			_credentials = DEFAULT;
			if (browser) localStorage.removeItem(localStorageKeys.activeUser);
		}
	};
}

export const credentialStore = createCredentialStore();
