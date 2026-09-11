<script lang="ts">
	import type { InviteRecord } from '$lib/db/subco_invite.repo';

	let {
		subcoId,
		inviteEndpoint,
		onInvite,
		onResend,
		onDelete
	}: {
		subcoId: number | null;
		inviteEndpoint: string;
		onInvite: (email: string) => Promise<void>;
		onResend?: (token: string) => Promise<void>;
		onDelete?: (token: string) => Promise<void>;
	} = $props();

	let inviteEmail = $state('');
	let invites = $state<InviteRecord[]>([]);
	let loading = $state(false);

	async function reload() {
		if (subcoId == null) return;
		loading = true;
		try {
			const res = await fetch(inviteEndpoint);
			invites = res.ok ? await res.json() : [];
		} catch {
			invites = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		reload();
	});

	async function invite() {
		const email = inviteEmail.trim();
		if (email.length === 0) return;
		await onInvite(email);
		inviteEmail = '';
		await reload();
	}

	async function resend(token: string) {
		await onResend?.(token);
		await reload();
	}

	async function del(token: string) {
		await onDelete?.(token);
		await reload();
	}
</script>

<div class="invites">
	<label for="subco-invite">
		invite by email
		{#if subcoId == null}<span class="required">*save first</span>{/if}
	</label>
	<div class="invite-row">
		<input
			id="subco-invite"
			type="email"
			bind:value={inviteEmail}
			placeholder="player@example.com"
			disabled={subcoId == null}
		/>
		<button class="btn" type="button" onclick={invite} disabled={subcoId == null}>invite</button>
	</div>
	{#if subcoId == null}
		<span class="hint">save the subco first to invite another player</span>
	{:else if loading}
		<span class="hint">loading…</span>
	{:else if invites.length > 0}
		<ul class="invite-list">
			{#each invites as inv (inv.token)}
				<li class="invite-item">
					<span class="email">{inv.email}</span>
					<span class="badge badge--{inv.status}">{inv.status}</span>
					{#if onResend && inv.status !== 'accepted'}
						<button class="action" type="button" onclick={() => resend(inv.token)}>resend</button>
					{/if}
					{#if onDelete}
						<button class="action action--danger" type="button" onclick={() => del(inv.token)}>delete</button>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.invites {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	label {
		font-family: var(--font-mono);
		font-size: 0.85em;
		color: var(--color-accent);
	}

	.invite-row {
		display: flex;
		gap: 8px;
	}

	.invite-row input {
		flex: 1;
	}

	.hint {
		font-family: var(--font-mono);
		font-size: 0.75em;
		color: var(--color-main-dim);
	}

	.required {
		font-size: 0.75em;
		color: var(--color-accent);
		margin-left: 4px;
	}

	.invite-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.invite-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-mono);
		font-size: 0.8em;
	}

	.email {
		flex: 1;
		color: var(--color-main);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.badge {
		padding: 1px 6px;
		font-size: 0.85em;
		border: 1px solid currentColor;
	}

	.badge--invited {
		color: var(--color-accent);
	}

	.badge--accepted {
		color: var(--color-main-dim);
	}

	.badge--error {
		color: #c0392b;
	}

	.action {
		background: none;
		border: none;
		cursor: pointer;
		font-family: var(--font-mono);
		font-size: 0.85em;
		color: var(--color-main-dim);
		padding: 0;
	}

	.action:hover {
		color: var(--color-accent);
	}

	.action--danger:hover {
		color: #c0392b;
	}
</style>
