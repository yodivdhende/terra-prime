<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import EventForm from '$lib/components/event-form.svelte';
	import CharacterVersionPreview from '$lib/components/character-version-preview.svelte';
	import ConfirmModal from '$lib/components/confirm-modal.svelte';
	import SearchSelect from '$lib/components/search-select.svelte';
	import { CirclePlus, Printer } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import type { LarpEvent } from '$lib/db/event.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	/** A row of `GET /api/characters/versions`; kept local so no server module is imported here. */
	type SelectableCharacterVersion = {
		id: number;
		name: string;
		characterId: number;
		characterName: string;
		ownerId: number;
		ownerName: string;
	};

	let { data }: PageProps = $props();
	const participants = $derived(data.participants ?? []);
	const allVersions = $derived<SelectableCharacterVersion[]>(data.allVersions ?? []);
	let event: LarpEvent | null = $state(null);
	$effect(() => {
		const { event: loadEvent } = data;
		const result: LarpEvent = {
			...loadEvent,
			start: new Date(loadEvent.start),
			end: new Date(loadEvent.end)
		};
		event = result;
	});

	async function save() {
		const eventToSave = $state.snapshot(event);
		if (eventToSave == null) return;
		const { id: eventId } = eventToSave;
		if (eventId == null) return;
		try {
			const result = await fetch(`/api/events/${eventId}`, {
				method: 'post',
				body: JSON.stringify(eventToSave),
				headers: {
					'content-type': 'application/json'
				}
			});
			if (result.ok) {
				TOAST_MANAGER.success('Event saved');
				await goto(resolve('/manage/events'));
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function remove() {
		const eventToSave = $state.snapshot(event);
		if (eventToSave == null) return;
		const { id: eventId } = eventToSave;
		if (eventId == null) return;
		try {
			const result = await fetch(`/api/events/${eventId}`, {
				method: 'delete',
				headers: {
					'content-type': 'application/json'
				}
			});
			if (result.ok) {
				TOAST_MANAGER.success('Event deleted');
				await goto(resolve('/manage/events'));
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	/** The message SvelteKit's `error()` puts on the body, falling back to the status line. */
	async function errorMessage(response: Response): Promise<string> {
		try {
			const body = await response.json();
			if (typeof body?.message === 'string') return body.message;
		} catch {
			// no JSON body — fall through
		}
		return response.statusText || 'Something went wrong';
	}

	const participatingOwnerIds = $derived(new Set(participants.map((p) => p.character.ownerId)));
	const participatingVersionIds = $derived(
		new Set(participants.map((p) => p.character.characterVersionId))
	);

	/**
	 * `Event_Participants` is keyed on (Event, User), so a second version for an owner who already
	 * plays this event cannot be stored — hide those instead of letting the POST fail.
	 */
	const versionOptions = $derived(
		allVersions
			.filter(
				(version) =>
					!participatingVersionIds.has(version.id) && !participatingOwnerIds.has(version.ownerId)
			)
			.map((version) => ({
				label: `${version.characterName} — ${version.name} (${version.ownerName})`,
				value: String(version.id)
			}))
	);

	type Draft = { key: number; characterVersionId: number | null };
	let drafts = $state<Draft[]>([]);
	let nextKey = 0;

	function addDraft() {
		drafts = [...drafts, { key: nextKey++, characterVersionId: null }];
	}

	function removeDraft(key: number) {
		drafts = drafts.filter((draft) => draft.key !== key);
	}

	async function saveDraft(draft: Draft) {
		const eventId = $state.snapshot(event)?.id;
		if (eventId == null || draft.characterVersionId == null) return;
		try {
			const result = await fetch(`/api/events/${eventId}/participants`, {
				method: 'post',
				body: JSON.stringify({ characterVersionId: draft.characterVersionId }),
				headers: { 'content-type': 'application/json' }
			});
			if (!result.ok) {
				TOAST_MANAGER.error(await errorMessage(result));
				return;
			}
			TOAST_MANAGER.success('Participant added');
			removeDraft(draft.key);
			await invalidateAll();
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	let participantModal: ConfirmModal;
	let pendingRemoval: { userId: number; characterVersion: number; name: string } | null =
		$state(null);

	function requestRemoveParticipant(participant: {
		userId: number;
		characterVersion: number;
		name: string;
	}) {
		pendingRemoval = participant;
		participantModal.open();
	}

	async function removeParticipant() {
		const eventId = $state.snapshot(event)?.id;
		const participant = pendingRemoval;
		pendingRemoval = null;
		if (eventId == null || participant == null) return;
		try {
			const result = await fetch(`/api/events/${eventId}/participants`, {
				method: 'delete',
				// This endpoint reads the event from the body, not the route params.
				body: JSON.stringify({
					eventId,
					userId: participant.userId,
					characterVersion: participant.characterVersion
				}),
				headers: { 'content-type': 'application/json' }
			});
			if (!result.ok) {
				TOAST_MANAGER.error(await errorMessage(result));
				return;
			}
			TOAST_MANAGER.success('Participant removed');
			await invalidateAll();
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}
</script>

<main>
	<div class="event-header">
		<a href={resolve('/manage/events')}>back</a>
	</div>
	{#if event != null}
		<div class="event-config">
			<EventForm bind:event />
		</div>
	{/if}
	<div>
		<button class="btn" onclick={save}>save</button>
		<button class="btn btn-danger" onclick={remove}>delete</button>
	</div>
	<section class="event-participants">
		{#if event?.id != null}
			<a href={resolve('/manage/events/[id]/coupons', { id: String(event.id) })}>Manage Coupons →</a
			>
			{#if participants.length > 0}
				<a href={resolve('/manage/events/[id]/sheets', { id: String(event.id) })}
					>Print all sheets →</a
				>
			{/if}
		{/if}
		<h2>Participants</h2>
		{#if event?.id != null}
			<button class="btn add" onclick={addDraft} aria-label="Add participant">
				<CirclePlus />
			</button>
		{/if}
		{#if participants.length === 0 && drafts.length === 0}
			<p class="status">No participants registered for this event.</p>
		{:else}
			<table>
				<thead>
					<tr>
						<th>Character</th>
						<th>Owner</th>
						<th>Version</th>
						<th>Overview</th>
						<th>Print</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each drafts as draft (draft.key)}
						<tr>
							<td colspan="4">
								<SearchSelect
									options={versionOptions}
									placeholder="Search character version..."
									onselect={(option) => (draft.characterVersionId = Number(option.value))}
								/>
							</td>
							<td colspan="2">
								<button
									class="btn"
									onclick={() => saveDraft(draft)}
									disabled={draft.characterVersionId == null}
								>
									save
								</button>
								<button class="btn" onclick={() => removeDraft(draft.key)}>cancel</button>
							</td>
						</tr>
					{/each}
					{#each participants as { character, version } (character.id)}
						<tr>
							<td>{character.name}</td>
							<td>{character.ownerName}</td>
							<td>{version?.name ?? '—'}</td>
							<td class="preview-cell">
								{#if version != null}
									<CharacterVersionPreview
										expertise={version.expertise}
										items={version.items}
										implants={version.implants}
										size="1em"
									/>
								{:else}
									<p class="status">version not found</p>
								{/if}
							</td>
							<td>
								{#if event?.id != null}
									<a
										class="print-link"
										aria-label="Print sheet for {character.name}"
										href="{resolve('/manage/events/[id]/sheets', {
											id: String(event.id)
										})}?versionId={character.characterVersionId}"
									>
										<Printer size="1.1em" />
									</a>
								{/if}
							</td>
							<td>
								<button
									class="btn btn-danger"
									onclick={() =>
										requestRemoveParticipant({
											userId: character.ownerId,
											characterVersion: character.characterVersionId,
											name: character.name
										})}
								>
									remove
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>
</main>

<ConfirmModal
	bind:this={participantModal}
	message="Remove {pendingRemoval?.name ?? 'this character'} from this event?"
	onconfirm={removeParticipant}
	oncancel={() => (pendingRemoval = null)}
/>

<style>
	main {
		display: grid;
		grid-template:
			'header header' min-content
			'config participants' min-content
			/ min-content min-content;
		gap: 1em;
		padding: 8px;
	}

	.event-header {
		grid-area: header;
	}

	.event-config {
		grid-area: config;
	}

	.event-participants {
		grid-area: participants;
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 12px;
	}

	table {
		margin-top: 8px;
		border-collapse: collapse;
		width: 100%;
	}

	th {
		text-align: left;
		padding: 8px;
		font-size: 0.8rem;
		opacity: 0.6;
	}

	tr {
		border-bottom: 1px solid silver;
	}

	td {
		padding: 8px;
	}

	.preview-cell {
		min-width: 200px;
		max-width: 320px;
	}

	.print-link {
		display: inline-flex;
		align-items: center;
		color: var(--color-accent);
	}

	.add {
		align-self: flex-start;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: var(--color-accent);
	}

	.status {
		font-size: 0.8rem;
		opacity: 0.5;
	}
</style>
