<script lang="ts">
	let { mode = 'form' }: { mode?: 'form' | 'button' } = $props();

	let email = $state('');
	let status = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');
	let message = $state('');

	async function send(event?: Event) {
		event?.preventDefault();
		if (status === 'sending') return;
		status = 'sending';
		message = '';
		try {
			let targetEmail = email;
			if (mode === 'button') {
				const meRes = await fetch('/api/my/user');
				if (!meRes.ok) {
					status = 'error';
					message = `could not load current user (${meRes.status})`;
					return;
				}
				const me = await meRes.json();
				targetEmail = me.email;
			}
			const res = await fetch('/api/authentication/forgot-password', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email: targetEmail })
			});
			if (res.ok) {
				status = 'sent';
				return;
			}
			const body = await res.json().catch(() => ({}));
			status = 'error';
			message = body?.message ?? `request failed (${res.status})`;
		} catch (err) {
			status = 'error';
			message = `${err}`;
		}
	}
</script>

{#if mode === 'button'}
	<button onclick={send} disabled={status === 'sending'}>
		{status === 'sending' ? 'sending…' : 'Reset password'}
	</button>
	{#if status === 'sent'}
		<span class="feedback ok">password reset email sent</span>
	{:else if status === 'error'}
		<span class="feedback err">{message}</span>
	{/if}
{:else}
	<form onsubmit={send}>
		<p class="hint">enter your email and we will send a password reset link</p>
		<label for="forgot-email">Email</label>
		<input type="email" id="forgot-email" bind:value={email} required />
		{#if status === 'sent'}
			<span class="ok">if that email is registered, a reset link has been sent</span>
		{/if}
		{#if status === 'error'}
			<span class="err">{message}</span>
		{/if}
		<button type="submit" disabled={status === 'sending'}>
			{status === 'sending' ? 'sending…' : 'Send reset link'}
		</button>
	</form>
{/if}

<style>
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

	.hint {
		font-size: 0.7em;
		opacity: 0.7;
		margin: 0;
	}

	.ok {
		font-size: 0.7em;
		color: var(--color-accent);
		opacity: 0.9;
	}

	.err {
		font-size: 0.7em;
		color: var(--color-error);
		opacity: 0.85;
	}

	.feedback {
		font-size: 0.7em;
	}

	.feedback.ok {
		color: var(--color-accent);
	}

	.feedback.err {
		color: var(--color-error);
		opacity: 0.85;
	}
</style>
