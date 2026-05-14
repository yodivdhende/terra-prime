<script lang="ts">
	import SearchBar from '$lib/codex/components/search-bar.svelte';
	import TaskIcons from './task-icons.svelte';
	import { UserRound } from '@lucide/svelte';
	import { WINDOW_MANAGER } from '$lib/codex/managers/window-manager.svelte';
	import { CREDENTIAL_MANAGER } from '$lib/local-utils/credential-manager.svelte';
	import { FEATURE_MANAGER } from '../managers/feature-manager.svelte';

	function openLogin() {
		WINDOW_MANAGER.openWindow({ id: 'login' });
		WINDOW_MANAGER.focusWindow('login');
	}
</script>

<main>
	<SearchBar />
	{#if FEATURE_MANAGER.loginEnabled}
		<button class="login-btn" onclick={openLogin} aria-label="Login">
			<UserRound size={32} />
			{#if CREDENTIAL_MANAGER.name}
				<span class="username">{CREDENTIAL_MANAGER.name}</span>
			{/if}
		</button>
	{/if}
	<TaskIcons />
</main>

<style>
	.login-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-bg);
		border: var(--border-width) solid var(--color-accent);
		padding: 1em;
		margin: calc(var(--border-width) * -1);
		color: var(--coor-main);
		cursor: pointer;
		transition:
			color 0.15s,
			background-color 0.15s;
	}

	.login-btn:hover {
		background-color: var(--color-accent);
		color: var(--color-bg);
	}

	.login-btn:active {
		background-color: var(--color-main);
		color: var(--color-bg);
	}

	.username {
		font-size: 0.75rem;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}

	main {
		width: 100%;
		height: min-content;
		flex-shrink: 0;
		background-color: var(--color-bg);
		border-top: 2px solid var(--color-accent);
		box-shadow: var(---color-accent) 0 0 8px;
		color: var(--color-main-dim);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.05em;
		display: flex;
		align-items: center;
		padding: 0 1rem;
		margin: 0 0 1em 1em;
		padding: 0;
	}
</style>
