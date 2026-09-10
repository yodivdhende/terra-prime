<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import MissionForm from '$lib/components/mission-form.svelte';
	import type { Mission, MissionDraft } from '$lib/db/mission.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let loaded = $derived<Mission | undefined>(data.mission);
	let mission: MissionDraft | null = $state(null);

	$effect(() => {
		const { mission: loadedMission } = data;
		mission = loadedMission
			? {
					id: loadedMission.id,
					name: loadedMission.name,
					playerLimit: loadedMission.playerLimit,
					status: loadedMission.status
				}
			: null;
	});

	async function save() {
		const draft = $state.snapshot(mission);
		if (draft?.id == null) return;
		try {
			const response = await fetch(`/api/missions/${draft.id}`, {
				method: 'post',
				body: JSON.stringify({
					name: draft.name,
					playerLimit: draft.playerLimit,
					status: draft.status
				}),
				headers: { 'content-type': 'application/json' }
			});
			if (response.ok) {
				TOAST_MANAGER.success('Mission saved');
				await goto(resolve('/manage/missions'));
			} else {
				TOAST_MANAGER.error('Failed to save mission');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function remove() {
		const draft = $state.snapshot(mission);
		if (draft?.id == null) return;
		try {
			const response = await fetch(`/api/missions/${draft.id}`, { method: 'delete' });
			if (response.ok) {
				TOAST_MANAGER.success('Mission deleted');
				await goto(resolve('/manage/missions'));
			} else {
				TOAST_MANAGER.error('Failed to delete mission');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function close() {
		const draft = $state.snapshot(mission);
		if (draft?.id == null) return;
		try {
			const response = await fetch(`/api/missions/${draft.id}/close`, { method: 'post' });
			if (response.ok) {
				TOAST_MANAGER.success('Mission closed');
				await invalidateAll();
			} else {
				TOAST_MANAGER.error('Failed to close mission');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}
</script>

<main>
	<a href={resolve('/manage/missions')}>back</a>
	{#if mission != null}
		<MissionForm bind:mission />

		<fieldset>
			<legend>Participants</legend>
			{#if (loaded?.participants.length ?? 0) === 0}
				<p class="hint">Nobody has registered for this mission yet.</p>
			{:else}
				<table>
					<thead>
						<tr>
							<th>Character</th>
							<th>Player</th>
							<th>Available prints</th>
							<th>Registered at</th>
						</tr>
					</thead>
					<tbody>
						{#each loaded?.participants ?? [] as participant (participant.characterVersionId)}
							<tr>
								<td>{participant.characterVersionName ?? participant.characterName ?? '—'}</td>
								<td>{participant.playerName}</td>
								<td>{participant.availablePrints}</td>
								<td>{participant.registerAt}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</fieldset>
	{:else}
		<p>Mission not found.</p>
	{/if}
	<div class="actions">
		<button class="btn" onclick={save}>save</button>
		<button class="btn" onclick={close} disabled={mission?.status === 'closed'}>
			{mission?.status === 'closed' ? 'closed' : 'close mission'}
		</button>
		<button class="btn btn-danger" onclick={remove}>delete</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 8px;
	}

	.actions {
		display: flex;
		gap: 8px;
	}

	fieldset {
		border: 1px solid var(--color-border, #444);
		border-radius: 4px;
		padding: 8px 12px;
	}

	legend {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.6;
		padding: 0 4px;
	}

	.hint {
		margin: 0;
		font-size: 0.8rem;
		opacity: 0.6;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		text-align: left;
		padding: 4px 8px;
	}
</style>
