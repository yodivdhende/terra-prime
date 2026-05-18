<script lang="ts">
	import { CREDENTIAL_MANAGER } from '$lib/local-utils/credential-manager.svelte';
	import { WINDOW_MANAGER, type CodexWindow } from '$lib/codex/managers/window-manager.svelte';

	let { window }: { window: CodexWindow } = $props();

	function logout() {
		CREDENTIAL_MANAGER.logout();
		WINDOW_MANAGER.closeWindow(window.id);
	}
</script>

<div class="logout">
	<p class="label">logged in as</p>
	<p class="username">{CREDENTIAL_MANAGER.credentials.name}</p>
	<button onclick={logout}>Logout</button>
</div>

<style>
	.logout {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		color: var(--color-main);
	}

	.label {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.5;
		margin: 0;
	}

	.username {
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.9rem;
		margin: 0;
	}

	button {
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		padding: 0.3rem 0.75rem;
		background: transparent;
		color: var(--color-main);
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		cursor: pointer;
		transition:
			border-color 0.15s,
			color 0.15s;
	}

	button:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
</style>
