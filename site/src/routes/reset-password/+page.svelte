<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	type Status = 'idle' | 'submitting' | 'success' | 'error' | 'missing-token';
	const token = $derived(page.url.searchParams.get('token') ?? '');
	let status: Status = $state(untrack(() => (token ? 'idle' : 'missing-token')));
	let message = $state('');

	let password = $state('');
	let confirm = $state('');
	let showPassword = $state(false);
	const passwordInputType = $derived(showPassword ? 'text' : 'password');

	function toggleShowPassword() {
		showPassword = !showPassword;
	}

	async function submit(event: Event) {
		event.preventDefault();
		if (status === 'submitting') return;
		message = '';
		if (password.length < 8) {
			status = 'error';
			message = 'password must be at least 8 characters';
			return;
		}
		if (password !== confirm) {
			status = 'error';
			message = 'passwords do not match';
			return;
		}
		status = 'submitting';
		try {
			const res = await fetch('/api/authentication/reset-password', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ token, password })
			});
			if (res.ok) {
				status = 'success';
				password = '';
				confirm = '';
				return;
			}
			const body = await res.json().catch(() => ({}));
			status = 'error';
			message = body?.message ?? `reset failed (${res.status})`;
		} catch (err) {
			status = 'error';
			message = `${err}`;
		}
	}
</script>

<main>
	<section>
		<h1>password reset</h1>
		{#if status === 'missing-token'}
			<p class="line err">missing or invalid reset link</p>
			<a href={resolve('/codex')}>back ›</a>
		{:else if status === 'success'}
			<p class="line ok">your password has been reset.</p>
			<a href={resolve('/codex')}>continue ›</a>
		{:else}
			<form onsubmit={submit}>
				<label for="password">new password</label>
				<div class="password">
					<input
						id="password"
						type={passwordInputType}
						bind:value={password}
						autocomplete="new-password"
					/>
					<button type="button" onclick={toggleShowPassword} aria-label="toggle password visibility">
						{showPassword ? '◎' : '◉'}
					</button>
				</div>
				<label for="confirm">confirm password</label>
				<div class="password">
					<input
						id="confirm"
						type={passwordInputType}
						bind:value={confirm}
						autocomplete="new-password"
					/>
				</div>
				{#if message}
					<p class="line err">{message}</p>
				{/if}
				<button type="submit" disabled={status === 'submitting'}>
					{status === 'submitting' ? 'resetting…' : 'reset password'}
				</button>
			</form>
		{/if}
	</section>
</main>

<style>
	main {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-mono);
		color: var(--color-main);
		background: var(--color-bg);
		padding: 1rem;
	}
	section {
		max-width: 480px;
		width: 100%;
		padding: 1.5rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
	}
	h1 {
		font-size: 1rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-accent);
		margin: 0 0 1rem;
	}
	form {
		display: grid;
		gap: 0.6rem;
	}
	label {
		font-size: 0.7em;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.7;
	}
	input {
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		color: var(--color-main);
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.85em;
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
	button {
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.75em;
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
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.line {
		font-size: 0.85rem;
		margin: 0;
	}
	.ok {
		color: var(--color-accent);
	}
	.err {
		color: tomato;
	}
	a {
		display: inline-block;
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-main);
		text-decoration: none;
		padding: 0.3rem 0.75rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		margin-top: 0.75rem;
	}
	a:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}
</style>
