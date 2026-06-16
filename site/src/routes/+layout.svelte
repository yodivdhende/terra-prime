<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { credentialStore } from '$lib/local-utils/credential-store.svelte';
	import { codexWindowManager } from '$lib/managers/codex-window-manager.svelte';

	const PUBLIC_PATHS = ['/promo', '/main/login', '/info'];

	onMount(async () => {
		if (page.url.pathname === '/') {
			goto('/promo');
			return;
		}

		credentialStore.initFromStorage();

		const response = await fetch('/api/users/active');
		if (response.status === 401) {
			credentialStore.logout();
		}
	});

	$effect(() => {
		if (!credentialStore.isLoggedIn) {
			const path = page.url.pathname;
			if (PUBLIC_PATHS.some((p) => path.startsWith(p))) return;

			if (path.startsWith('/codex')) {
				codexWindowManager.closeAll();
				goto('/main/login');
			} else if (path.startsWith('/main/dashboard/manage')) {
				goto('/main/dashboard/manage');
			} else if (path !== '/') {
				goto('/main/login');
			}
		}
	});

	let { children }: LayoutProps = $props();
</script>

{@render children()}
