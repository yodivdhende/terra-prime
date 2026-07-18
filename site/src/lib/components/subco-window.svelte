<script lang="ts">
	import { type CodexWindow } from '$lib/managers/window-manager.svelte';
	import SubcoForm from '$lib/components/subco-form.svelte';
	import SubcoBackstory from '$lib/components/subco-backstory.svelte';
	import SubcoInvites from '$lib/components/subco-invites.svelte';
	import type { Subco } from '$lib/db/subco.repo';
	import type { PendingInvite } from '$lib/db/subco_invite.repo';

	let { window: _window }: { window: CodexWindow } = $props();

	function emptySubco(): Subco {
		return { id: null, name: '', company: 0, backstoryId: null, ownerId: 0, members: [] };
	}

	let subcos = $state<Subco[]>([]);
	let selected = $state<Subco>(emptySubco());
	let loading = $state(true);
	let status = $state<string | null>(null);
	let myUserId = $state<number | null>(null);
	let isOwner = $derived(selected.id == null || selected.ownerId === myUserId);

	let pendingInvites = $state<PendingInvite[]>([]);
	let selectedInvite = $state<PendingInvite | null>(null);
	let myCharacters = $state<{ id: number; name: string }[]>([]);
	let inviteCharacterId = $state<number | null>(null);
	let inviteError = $state<string | null>(null);

	async function reload() {
		loading = true;
		try {
			const [subcosRes, invitesRes, charsRes, userRes] = await Promise.all([
				fetch('/api/my/subco'),
				fetch('/api/my/subco/invites'),
				fetch('/api/my/characters'),
				fetch('/api/my/user')
			]);
			subcos = subcosRes.ok ? await subcosRes.json() : [];
			pendingInvites = invitesRes.ok ? await invitesRes.json() : [];
			myCharacters = charsRes.ok ? await charsRes.json() : [];
			myUserId = userRes.ok ? (await userRes.json()).id : null;
		} catch {
			subcos = [];
			pendingInvites = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		reload();
	});

	function edit(subco: Subco) {
		selected = { ...subco, members: [...subco.members] };
		selectedInvite = null;
		inviteError = null;
		status = null;
	}

	function newSubco() {
		selected = emptySubco();
		selectedInvite = null;
		inviteError = null;
		status = null;
	}

	function selectInvite(invite: PendingInvite) {
		selectedInvite = invite;
		inviteCharacterId = null;
		inviteError = null;
		status = null;
	}

	async function save() {
		const snap = $state.snapshot(selected);
		const isNew = snap.id == null;
		status = null;
		try {
			const res = isNew
				? await fetch('/api/my/subco', {
						method: 'put',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify(snap)
					})
				: await fetch(`/api/my/subco/${snap.id}`, {
						method: 'post',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify(snap)
					});
			if (!res.ok) {
				status = 'could not save subco';
				return;
			}
			if (isNew) {
				const { id: newId }: { id: number } = await res.json();
				await reload();
				const match = subcos.find((s) => s.id === newId);
				if (match) selected = { ...match, members: [...match.members] };
			} else {
				status = 'saved';
				await reload();
			}
		} catch {
			status = 'could not save subco';
		}
	}

	async function invite(email: string) {
		const id = $state.snapshot(selected).id;
		if (id == null) return;
		try {
			const res = await fetch(`/api/my/subco/${id}/invite`, {
				method: 'post',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email })
			});
			status = res.ok ? `invited ${email}` : 'could not send invite';
		} catch {
			status = 'could not send invite';
		}
	}

	async function acceptInvite() {
		const inv = $state.snapshot(selectedInvite);
		if (inv == null || inviteCharacterId == null) return;
		inviteError = null;
		try {
			const res = await fetch(`/api/my/subco/invite/${inv.token}`, {
				method: 'post',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ characterId: inviteCharacterId })
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				inviteError = body?.message ?? 'could not join subco';
				return;
			}
			selectedInvite = null;
			await reload();
		} catch {
			inviteError = 'could not join subco';
		}
	}
</script>

<div class="subco-window">
	<div class="list">
		{#if pendingInvites.length > 0}
			<span class="section-label">invites</span>
			{#each pendingInvites as inv (inv.token)}
				<button
					class="entry invite-entry"
					class:active={selectedInvite?.token === inv.token}
					onclick={() => selectInvite(inv)}
				>
					{inv.subcoName}
				</button>
			{/each}
			<hr class="divider" />
		{/if}
		<button class="new btn" onclick={newSubco}>+ new subco</button>
		{#if loading}
			<span class="status">loading...</span>
		{:else if subcos.length === 0 && pendingInvites.length === 0}
			<span class="status">no subcos yet</span>
		{:else}
			{#each subcos as subco (subco.id)}
				<button
					class="entry"
					class:active={selected.id === subco.id && selectedInvite == null}
					onclick={() => edit(subco)}
				>
					{subco.name}
				</button>
			{/each}
		{/if}
	</div>

	<div class="detail">
		{#if selectedInvite != null}
			<div class="invite-detail">
				<p class="invite-heading">
					you have been invited to join <strong>{selectedInvite.subcoName}</strong>
				</p>
				<label class="invite-label">
					select a character to join with
					<select bind:value={inviteCharacterId} class="invite-select">
						<option value={null} disabled>— pick a character —</option>
						{#each myCharacters as c (c.id)}
							<option value={c.id}>{c.name}</option>
						{/each}
					</select>
				</label>
				{#if inviteError}
					<span class="error">{inviteError}</span>
				{/if}
				<div class="actions">
					<button class="btn" onclick={acceptInvite} disabled={inviteCharacterId == null}>
						join
					</button>
				</div>
			</div>
		{:else}
			<SubcoForm
				bind:subco={selected}
				charactersEndpoint="/api/my/characters"
				nameEditable={isOwner}
			/>
			{#if selected.id != null}
				<SubcoInvites
					subcoId={selected.id}
					inviteEndpoint="/api/my/subco/{selected.id}/invite"
					onInvite={invite}
				/>
				<SubcoBackstory
					subcoId={selected.id}
					subcoName={selected.name}
					bind:backstoryId={selected.backstoryId}
					newEndpoint="/api/my/subco/backstory"
				/>
			{/if}
			<div class="actions">
				<button class="btn" onclick={save}>save</button>
				{#if status}<span class="status">{status}</span>{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.subco-window {
		display: flex;
		height: 100%;
		font-family: var(--font-mono);
		color: var(--color-main);
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 160px;
		padding: 8px;
		border-right: 1px solid var(--border-color-dim);
		overflow-y: auto;
	}

	.detail {
		flex: 1;
		padding: 8px;
		overflow-y: auto;
	}

	.entry,
	.new {
		text-align: left;
		background: none;
		color: var(--color-main);
		cursor: pointer;
		padding: 4px 6px;
		font-family: inherit;
	}

	.new {
		color: var(--color-accent);
	}

	.entry {
		border: none;
	}

	.entry:hover,
	.entry.active {
		color: var(--color-accent);
	}

	.invite-entry {
		color: var(--color-main-dim);
	}

	.invite-entry:hover,
	.invite-entry.active {
		color: var(--color-accent);
	}

	.section-label {
		font-size: 0.75em;
		color: var(--color-main-dim);
		padding: 0 6px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.divider {
		border: none;
		border-top: 1px solid var(--border-color-dim);
		margin: 4px 0;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 8px;
	}

	.status {
		color: var(--color-main-dim);
	}

	.invite-detail {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 4px 0;
	}

	.invite-heading {
		margin: 0;
	}

	.invite-label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 0.9em;
		color: var(--color-main-dim);
	}

	.invite-select {
		font-family: var(--font-mono);
		background: var(--color-bg);
		color: var(--color-main);
		border: 1px solid var(--border-color-dim);
		padding: 4px 6px;
	}

	.error {
		color: var(--color-error, red);
		font-size: 0.85em;
	}
</style>
