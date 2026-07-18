<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import SubcoForm from '$lib/components/subco-form.svelte';
	import SubcoBackstory from '$lib/components/subco-backstory.svelte';
	import SubcoInvites from '$lib/components/subco-invites.svelte';
	import ConfirmModal from '$lib/components/confirm-modal.svelte';
	import CharacterVersionPreview from '$lib/components/character-version-preview.svelte';
	import DataTable from '$lib/components/data-table.svelte';
	import type { Subco } from '$lib/db/subco.repo';
	import type { SubcoMemberEntry } from '../../../api/subco/[id]/members/+server';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();

	let modal: ConfirmModal;
	let subco: Subco = $state({ id: null, name: '', company: 0, backstoryId: null, members: [] });

	$effect(() => {
		subco = {
			id: data.subco.id,
			name: data.subco.name,
			company: data.subco.company,
			backstoryId: data.subco.backstoryId,
			members: [...data.subco.members]
		};
	});

	const memberColumns = [
		{ label: 'Character', key: 'characterName' },
		{ label: 'Owner', key: 'ownerName' },
		{ label: 'Version', key: 'versionName' },
		{ label: 'Event', key: 'eventName' },
		{ label: 'Preview', key: '_preview' }
	];

	// Flatten nested fields so DataTable column filters work, keep full entry for the row snippet.
	const memberItems = $derived(
		data.members.map((m) => ({
			id: m.characterId,
			characterName: m.characterName,
			ownerName: m.ownerName,
			versionName: m.lastVersion?.name ?? '',
			eventName: m.lastVersion?.event?.name ?? '',
			_preview: '',
			_entry: m as unknown
		}))
	);

	async function saveSubco() {
		const snap = $state.snapshot(subco);
		if (snap.id == null) return;
		try {
			const result = await fetch(`/api/subco/${snap.id}`, {
				method: 'post',
				body: JSON.stringify(snap),
				headers: { 'content-type': 'application/json' }
			});
			if (result.ok) {
				TOAST_MANAGER.success('Subco saved');
				await goto(resolve('/manage/subco'));
			} else {
				TOAST_MANAGER.error('Could not save subco');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function removeSubco() {
		const snap = $state.snapshot(subco);
		if (snap.id == null) return;
		try {
			const result = await fetch(`/api/subco/${snap.id}`, { method: 'delete' });
			if (result.ok) {
				TOAST_MANAGER.success('Subco deleted');
				await goto(resolve('/manage/subco'));
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function inviteByEmail(email: string) {
		const snap = $state.snapshot(subco);
		if (snap.id == null) return;
		try {
			const result = await fetch(`/api/subco/${snap.id}/invite`, {
				method: 'post',
				body: JSON.stringify({ email }),
				headers: { 'content-type': 'application/json' }
			});
			if (result.ok) {
				TOAST_MANAGER.success(`Invited ${email}`);
			} else {
				TOAST_MANAGER.error('Could not send invite');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function resendInvite(token: string) {
		const snap = $state.snapshot(subco);
		if (snap.id == null) return;
		try {
			const result = await fetch(`/api/subco/${snap.id}/invite/${token}`, { method: 'post' });
			if (result.ok) {
				TOAST_MANAGER.success('Invite resent');
			} else {
				TOAST_MANAGER.error('Could not resend invite');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function deleteInvite(token: string) {
		const snap = $state.snapshot(subco);
		if (snap.id == null) return;
		try {
			const result = await fetch(`/api/subco/${snap.id}/invite/${token}`, { method: 'delete' });
			if (!result.ok) TOAST_MANAGER.error('Could not delete invite');
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}
</script>

<main>
	<div class="header">
		<a href={resolve('/manage/subco')}>back</a>
		<h2>Subco</h2>
	</div>
	<div class="form">
		<SubcoForm bind:subco />
	</div>
	{#if subco.id != null}
		<div class="invite">
			<SubcoInvites
				subcoId={subco.id}
				inviteEndpoint="/api/subco/{subco.id}/invite"
				onInvite={inviteByEmail}
				onResend={resendInvite}
				onDelete={deleteInvite}
			/>
		</div>
		<div class="background">
			<SubcoBackstory
				subcoId={subco.id}
				subcoName={subco.name}
				bind:backstoryId={subco.backstoryId}
			/>
		</div>
	{/if}
	{#if data.members.length > 0}
		<div class="members">
			<DataTable items={memberItems} columns={memberColumns}>
				{#snippet row(item)}
					{@const m = item._entry as SubcoMemberEntry}
					<tr>
						<td>{m.characterName}</td>
						<td class="dim">{m.ownerName}</td>
						<td>{m.lastVersion?.name ?? '—'}</td>
						<td>{m.lastVersion?.event?.name ?? '—'}</td>
						<td class="preview-cell">
							{#if m.lastVersion}
								<CharacterVersionPreview
									expertise={m.lastVersion.expertise}
									items={m.lastVersion.items}
									implants={m.lastVersion.implants}
									size="1em"
								/>
							{/if}
						</td>
					</tr>
				{/snippet}
			</DataTable>
		</div>
	{/if}
	<div class="actions">
		<button class="btn" onclick={saveSubco}>save</button>
		<button class="btn btn-danger" onclick={() => modal.open()}>delete</button>
	</div>
</main>

<ConfirmModal
	bind:this={modal}
	message="Delete this subco?"
	onconfirm={removeSubco}
	oncancel={() => modal.close()}
/>

<style>
	main {
		display: grid;
		grid-template:
			'header header' min-content
			'form invite' 1fr
			'form background' 1fr
			'members members' auto
			'actions actions' min-content
			/ 1fr 1fr;
		padding: 8px;
		gap: 16px;
		min-width: 360px;
	}

	.header {
		grid-area: header;
		display: flex;
	}

	.form {
		grid-area: form;
	}

	.invite {
		grid-area: invite;
	}

	.background {
		grid-area: background;
	}

	.members {
		grid-area: members;
	}

	.dim {
		color: var(--color-main-dim);
	}

	.preview-cell {
		min-width: 200px;
	}

	.actions {
		grid-area: actions;
		display: flex;
		gap: 8px;
	}
</style>
