<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import SubcoForm from '$lib/components/subco-form.svelte';
	import ConfirmModal from '$lib/components/confirm-modal.svelte';
	import type { Subco } from '$lib/db/subco.repo';
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
</script>

<main>
	<a href={resolve('/manage/subco')}>back</a>
	<h2>Subco</h2>
	<SubcoForm bind:subco onInvite={inviteByEmail} />
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
		display: flex;
		flex-direction: column;
		padding: 8px;
		gap: 16px;
		min-width: 360px;
	}
	.actions {
		display: flex;
		gap: 8px;
	}
</style>
