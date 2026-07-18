<script lang="ts">
	import { type CodexWindow } from '$lib/managers/window-manager.svelte';
	import SubcoForm from '$lib/components/subco-form.svelte';
	import type { Subco } from '$lib/db/subco.repo';

	let { window: _window }: { window: CodexWindow } = $props();

	function emptySubco(): Subco {
		return { id: null, name: '', company: 0, backstoryId: null, members: [] };
	}

	let subcos = $state<Subco[]>([]);
	let selected = $state<Subco>(emptySubco());
	let loading = $state(true);
	let status = $state<string | null>(null);
	let inviteEmail = $state('');

	async function reload() {
		loading = true;
		try {
			const res = await fetch('/api/my/subco');
			subcos = res.ok ? await res.json() : [];
		} catch {
			subcos = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		reload();
	});

	function edit(subco: Subco) {
		selected = { ...subco, members: [...subco.members] };
		status = null;
	}

	function newSubco() {
		selected = emptySubco();
		status = null;
	}

	async function save() {
		const snap = $state.snapshot(selected);
		const isNew = snap.id == null;
		if (isNew && inviteEmail.trim() === '') {
			status = 'invite another player before creating a subco';
			return;
		}
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
				const emailToInvite = inviteEmail.trim();
				inviteEmail = '';
				await invite(emailToInvite, newId);
			} else {
				status = 'saved';
				await reload();
			}
		} catch {
			status = 'could not save subco';
		}
	}

	async function invite(email: string, subcoId?: number | null) {
		const id = subcoId ?? $state.snapshot(selected).id;
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
</script>

<div class="subco-window">
	<div class="list">
		<button class="new" onclick={newSubco}>+ new subco</button>
		{#if loading}
			<span class="status">loading...</span>
		{:else if subcos.length === 0}
			<span class="status">no subcos yet</span>
		{:else}
			{#each subcos as subco (subco.id)}
				<button class="entry" class:active={selected.id === subco.id} onclick={() => edit(subco)}>
					{subco.name}
				</button>
			{/each}
		{/if}
	</div>

	<div class="detail">
		<SubcoForm
			bind:subco={selected}
			bind:inviteEmail
			charactersEndpoint="/api/my/characters"
			onInvite={invite}
		/>
		<div class="actions">
			<button class="btn" onclick={save}>save</button>
			{#if status}<span class="status">{status}</span>{/if}
		</div>
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
		border: none;
		color: var(--color-main);
		cursor: pointer;
		padding: 4px 6px;
		font-family: inherit;
	}

	.new {
		color: var(--color-accent);
	}

	.entry:hover,
	.entry.active {
		color: var(--color-accent);
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
</style>
