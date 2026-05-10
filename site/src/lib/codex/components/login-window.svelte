<script lang="ts">
	import { enhance } from '$app/forms';
	import { credentialStore } from '$lib/local-utils/credential-store.svelte';
	import { WINDOW_SERVICE, type CodexWindow } from '$lib/codex/services/window-service.svelte';

	let { window }: { window: CodexWindow } = $props();

	let showPassword = $state(false);
	let passwordInputType = $derived(showPassword ? 'text' : 'password');
	let submitButton: HTMLButtonElement;
	let errorMessage = $state<string | null>(null);

	function toggleShowPassword() {
		showPassword = !showPassword;
	}

	function login(event: KeyboardEvent) {
		if (event.key !== 'Enter') return;
		submitButton?.click();
	}

	function handleLogin() {
		async ({ result }) => {
			if (result.type === 'success' && result.data?.success) {
				credentialStore.roles = result.data.success.roles;
				credentialStore.name = result.data.success.name ?? '';
				errorMessage = null;
				WINDOW_SERVICE.closeWindow(window.id);
			} else if (result.type === 'success' && result.data?.error) {
				errorMessage = JSON.stringify(result.data.error);
			}
		};
	}
</script>

<div class="login">
	<form method="POST" action="/main/login" use:enhance={handleLogin}>
		<label for="login-email">Email</label>
		<input type="email" name="email" id="login-email" />
		<label for="login-password">Password</label>
		<div class="password">
			<input type={passwordInputType} name="password" id="login-password" onkeydown={login} />
			<button type="button" onclick={toggleShowPassword}>
				{showPassword ? '◎' : '◉'}
			</button>
		</div>
		{#if errorMessage}
			<span class="error">{errorMessage}</span>
		{/if}
		<button bind:this={submitButton}>Login</button>
	</form>
	<a href="/main/login/register">Register</a>
</div>

<style>
	.login {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		color: var(--color-main);
	}

	form {
		display: grid;
		gap: 0.6rem;
	}

	label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.7;
	}

	input {
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		color: var(--color-main);
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.85rem;
		padding: 0.3rem 0.5rem;
		width: 100%;
		box-sizing: border-box;
	}

	input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.password {
		display: flex;
	}

	.password input {
		flex: 1;
	}

	.password button {
		border-left: none;
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

	.error {
		font-size: 0.7rem;
		color: var(--color-error);
		opacity: 0.8;
	}

	a {
		font-size: 0.7rem;
		color: var(--color-main-dim);
		text-decoration: underline;
		opacity: 0.6;
	}

	a:hover {
		opacity: 1;
		color: var(--color-accent);
	}
</style>
