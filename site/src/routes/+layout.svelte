<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { credentialStore } from '$lib/local-utils/credential-store.svelte';
	import { codexWindowManager } from '$lib/managers/codex-window-manager.svelte';

	// Paths this effect leaves alone entirely: genuinely public pages, plus any route
	// whose own access control (if it has any) shouldn't be second-guessed by the
	// client-only `credentialStore` (backed by localStorage) checked below.
	// `/games/*` has no login requirement at all (walk-up terminal), so bouncing an
	// unauthenticated visitor to `/codex` here would be actively wrong, not just
	// redundant with a server-side guard.
	const PUBLIC_PATHS = ['/promo', '/manage/login', '/info', '/games'];

	let initialized = $state(false);

	onMount(async () => {
		credentialStore.initFromStorage();

		if (page.url.pathname === '/') {
			goto(resolve('/codex'));
		}

		const response = await fetch('/api/my/user');
		if (response.status === 401) {
			await credentialStore.logout();
		}

		initialized = true;

		const originalFetch = window.fetch.bind(window);
		let sessionCheckPromise: Promise<void> | null = null;

		window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
			const res = await originalFetch(...args);
			if (res.status === 401) {
				const url = args[0]?.toString() ?? '';
				if (!url.includes('/api/my/user')) {
					if (!sessionCheckPromise) {
						sessionCheckPromise = originalFetch('/api/my/user')
							.then(async (check) => {
								if (check.status === 401) await credentialStore.logout();
							})
							.finally(() => {
								sessionCheckPromise = null;
							});
					}
					await sessionCheckPromise;
				}
			}
			return res;
		};
	});

	$effect(() => {
		if (!initialized) return;
		if (!credentialStore.isLoggedIn) {
			const path = page.url.pathname;
			if (PUBLIC_PATHS.some((p) => path.startsWith(p))) return;

			if (path.startsWith('/codex')) {
				codexWindowManager.closeAll();
			} else if (path.startsWith('/manage')) {
				goto(resolve('/manage/login'));
			} else if (path !== '/') {
				goto(resolve('/codex'));
			}
		}
	});

	let { children }: LayoutProps = $props();
</script>

{@render children()}
