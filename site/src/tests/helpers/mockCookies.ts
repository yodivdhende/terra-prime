import type { Cookies } from '@sveltejs/kit';

export function mockCookies(token?: string): Cookies {
	const store = new Map<string, string>();
	if (token) store.set('session-token', token);

	return {
		get: (name: string) => store.get(name),
		getAll: () => [...store.entries()].map(([name, value]) => ({ name, value })),
		set: (name: string, value: string) => {
			store.set(name, value);
		},
		delete: (name: string) => {
			store.delete(name);
		},
		serialize: () => '',
	} as unknown as Cookies;
}
