<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	type Status = 'pending' | 'success' | 'error';
	let status: Status = $state('pending');
	let message = $state('');

	onMount(async () => {
		const token = page.url.searchParams.get('token');
		if (token == null || token.length === 0) {
			status = 'error';
			message = 'missing verification token';
			return;
		}
		try {
			const res = await fetch('/api/authentication/verify-email', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ token })
			});
			if (res.ok) {
				status = 'success';
				return;
			}
			const body = await res.json().catch(() => ({}));
			status = 'error';
			message = body?.message ?? `verification failed (${res.status})`;
		} catch (err) {
			status = 'error';
			message = `${err}`;
		}
	});
</script>

<main>
	<section>
		<h1>email verification</h1>
		{#if status === 'pending'}
			<p class="line">verifying token…</p>
		{:else if status === 'success'}
			<p class="line ok">your email has been verified.</p>
			<a href="/codex">continue ›</a>
		{:else}
			<p class="line err">{message}</p>
			<a href="/codex">back ›</a>
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
	.line {
		font-size: 0.85rem;
		margin: 0 0 1rem;
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
	}
	a:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}
</style>
