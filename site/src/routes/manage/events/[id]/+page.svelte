<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import EventForm from '$lib/components/event-form.svelte';
	import CharacterVersionPreview from '$lib/components/character-version-preview.svelte';
	import ConfirmModal from '$lib/components/confirm-modal.svelte';
	import SearchSelect from '$lib/components/search-select.svelte';
	import { CirclePlus, Printer } from '@lucide/svelte';
	import type { ComponentProps } from 'svelte';
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
		kind: 'player' | 'npc';
	};

	type ExtraRow = {
		id: number;
		userId: number;
		userName: string;
		characterVersionId: number | null;
		characterVersionName: string | null;
		characterId: number | null;
		characterName: string | null;
	};

	type ExtraWithVersion = {
		extra: ExtraRow;
		version: {
			expertise: ComponentProps<typeof CharacterVersionPreview>['expertise'];
			items: ComponentProps<typeof CharacterVersionPreview>['items'];
			implants: ComponentProps<typeof CharacterVersionPreview>['implants'];
		} | null;
	};

	let { data }: PageProps = $props();
	const participants = $derived(data.participants ?? []);
	const allVersions = $derived<SelectableCharacterVersion[]>(data.allVersions ?? []);
	const extras = $derived<ExtraWithVersion[]>(data.extras ?? []);
	const users = $derived<{ id: number; name: string }[]>(data.users ?? []);
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
	 * `Event_Players` is keyed on (Event, User), so a second version for an owner who already
	 * plays this event cannot be stored — hide those instead of letting the POST fail. NPC versions
	 * are hidden too: they belong to the extras table.
	 */
	const versionOptions = $derived(
		allVersions
			.filter(
				(version) =>
					version.kind === 'player' &&
					!participatingVersionIds.has(version.id) &&
					!participatingOwnerIds.has(version.ownerId)
			)
			.map((version) => ({
				label: `${version.characterName} — ${version.name} (${version.ownerName})`,
				value: String(version.id)
			}))
	);

	/** One row per extra, with every version they hold at this event. */
	const extrasByUser = $derived(
		extras.reduce(
			(rows, { extra, version }) => {
				const row = rows.find((r) => r.userId === extra.userId);
				const assignment =
					extra.characterVersionId == null
						? null
						: {
								characterVersionId: extra.characterVersionId,
								characterName: extra.characterName ?? '',
								versionName: extra.characterVersionName ?? '',
								version
							};
				if (row) {
					if (assignment) row.assignments.push(assignment);
				} else {
					rows.push({
						userId: extra.userId,
						userName: extra.userName,
						assignments: assignment ? [assignment] : []
					});
				}
				return rows;
			},
			[] as {
				userId: number;
				userName: string;
				assignments: {
					characterVersionId: number;
					characterName: string;
					versionName: string;
					version: ExtraWithVersion['version'];
				}[];
			}[]
		)
	);

	const extraUserIds = $derived(new Set(extras.map(({ extra }) => extra.userId)));

	const extraUserOptions = $derived(
		users
			.filter((user) => !extraUserIds.has(user.id))
			.map((user) => ({ label: user.name, value: String(user.id) }))
	);

	/** Only NPC versions are handed to extras, and only once per event. */
	const assignedVersionIds = $derived(
		new Set(
			extras.flatMap(({ extra }) =>
				extra.characterVersionId == null ? [] : [extra.characterVersionId]
			)
		)
	);

	const npcVersionOptions = $derived(
		allVersions
			.filter((version) => version.kind === 'npc' && !assignedVersionIds.has(version.id))
			.map((version) => ({
				label: `${version.characterName} — ${version.name}`,
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

	type ExtraDraft = { key: number; userId: number | null };
	let extraDrafts = $state<ExtraDraft[]>([]);
	let nextExtraKey = 0;

	function addExtraDraft() {
		extraDrafts = [...extraDrafts, { key: nextExtraKey++, userId: null }];
	}

	function removeExtraDraft(key: number) {
		extraDrafts = extraDrafts.filter((draft) => draft.key !== key);
	}

	async function saveExtraDraft(draft: ExtraDraft) {
		const eventId = $state.snapshot(event)?.id;
		if (eventId == null || draft.userId == null) return;
		try {
			const result = await fetch(`/api/events/${eventId}/extras`, {
				method: 'post',
				body: JSON.stringify({ userId: draft.userId }),
				headers: { 'content-type': 'application/json' }
			});
			if (!result.ok) {
				TOAST_MANAGER.error(await errorMessage(result));
				return;
			}
			TOAST_MANAGER.success('Extra added');
			removeExtraDraft(draft.key);
			await invalidateAll();
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	/** Per-extra draft rows, keyed by user: one open assignment picker per extra at a time. */
	let assignDrafts = $state<{ userId: number; characterVersionId: number | null }[]>([]);

	function addAssignDraft(userId: number) {
		if (assignDrafts.some((draft) => draft.userId === userId)) return;
		assignDrafts = [...assignDrafts, { userId, characterVersionId: null }];
	}

	function removeAssignDraft(userId: number) {
		assignDrafts = assignDrafts.filter((draft) => draft.userId !== userId);
	}

	async function saveAssignDraft(draft: { userId: number; characterVersionId: number | null }) {
		const eventId = $state.snapshot(event)?.id;
		if (eventId == null || draft.characterVersionId == null) return;
		try {
			const result = await fetch(`/api/events/${eventId}/extras`, {
				method: 'put',
				body: JSON.stringify({
					userId: draft.userId,
					characterVersionId: draft.characterVersionId
				}),
				headers: { 'content-type': 'application/json' }
			});
			if (!result.ok) {
				TOAST_MANAGER.error(await errorMessage(result));
				return;
			}
			TOAST_MANAGER.success('Character assigned');
			removeAssignDraft(draft.userId);
			await invalidateAll();
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	let extraModal: ConfirmModal;
	/** A null `characterVersion` removes the extra from the event entirely. */
	let pendingExtraRemoval: { userId: number; characterVersion: number | null; name: string } | null =
		$state(null);

	function requestRemoveExtra(extra: {
		userId: number;
		characterVersion: number | null;
		name: string;
	}) {
		pendingExtraRemoval = extra;
		extraModal.open();
	}

	async function removeExtra() {
		const eventId = $state.snapshot(event)?.id;
		const extra = pendingExtraRemoval;
		pendingExtraRemoval = null;
		if (eventId == null || extra == null) return;
		try {
			const result = await fetch(`/api/events/${eventId}/extras`, {
				method: 'delete',
				body: JSON.stringify({
					userId: extra.userId,
					characterVersionId: extra.characterVersion ?? undefined
				}),
				headers: { 'content-type': 'application/json' }
			});
			if (!result.ok) {
				TOAST_MANAGER.error(await errorMessage(result));
				return;
			}
			TOAST_MANAGER.success(extra.characterVersion == null ? 'Extra removed' : 'Character removed');
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
		<h2>Players</h2>
		{#if event?.id != null}
			<button class="btn add" onclick={addDraft} aria-label="Add participant">
				<CirclePlus />
			</button>
		{/if}
		{#if participants.length === 0 && drafts.length === 0}
			<p class="status">No players registered for this event.</p>
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

		<h2>Extras</h2>
		<p class="status">
			Crew and NPC actors. An extra does not build a character — assign them NPC versions from the
			pool authored under <a href={resolve('/manage/characters')}>characters</a>.
		</p>
		{#if event?.id != null}
			<button class="btn add" onclick={addExtraDraft} aria-label="Add extra">
				<CirclePlus />
			</button>
		{/if}
		{#if extrasByUser.length === 0 && extraDrafts.length === 0}
			<p class="status">No extras enrolled for this event.</p>
		{:else}
			<table>
				<thead>
					<tr>
						<th>Extra</th>
						<th>Characters</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each extraDrafts as draft (draft.key)}
						<tr>
							<td>
								<SearchSelect
									options={extraUserOptions}
									placeholder="Search user..."
									onselect={(option) => (draft.userId = Number(option.value))}
								/>
							</td>
							<td colspan="2">
								<button
									class="btn"
									onclick={() => saveExtraDraft(draft)}
									disabled={draft.userId == null}
								>
									save
								</button>
								<button class="btn" onclick={() => removeExtraDraft(draft.key)}>cancel</button>
							</td>
						</tr>
					{/each}
					{#each extrasByUser as extra (extra.userId)}
						<tr>
							<td>{extra.userName}</td>
							<td>
								{#if extra.assignments.length === 0}
									<p class="status">No characters assigned yet.</p>
								{/if}
								{#each extra.assignments as assignment (assignment.characterVersionId)}
									<div class="assignment">
										<span class="assignment-name">
											{assignment.characterName} — {assignment.versionName}
										</span>
										{#if assignment.version != null}
											<div class="preview-cell">
												<CharacterVersionPreview
													expertise={assignment.version.expertise}
													items={assignment.version.items}
													implants={assignment.version.implants}
													size="1em"
												/>
											</div>
										{/if}
										<button
											class="btn btn-danger"
											onclick={() =>
												requestRemoveExtra({
													userId: extra.userId,
													characterVersion: assignment.characterVersionId,
													name: `${assignment.characterName} — ${assignment.versionName}`
												})}
										>
											remove
										</button>
									</div>
								{/each}
								{#each assignDrafts.filter((draft) => draft.userId === extra.userId) as draft (draft.userId)}
									<div class="assignment">
										<SearchSelect
											options={npcVersionOptions}
											placeholder="Search npc version..."
											onselect={(option) => (draft.characterVersionId = Number(option.value))}
										/>
										<button
											class="btn"
											onclick={() => saveAssignDraft(draft)}
											disabled={draft.characterVersionId == null}
										>
											save
										</button>
										<button class="btn" onclick={() => removeAssignDraft(extra.userId)}>
											cancel
										</button>
									</div>
								{/each}
								<button
									class="btn add"
									onclick={() => addAssignDraft(extra.userId)}
									aria-label="Assign character to {extra.userName}"
								>
									<CirclePlus />
								</button>
							</td>
							<td>
								<button
									class="btn btn-danger"
									onclick={() =>
										requestRemoveExtra({
											userId: extra.userId,
											characterVersion: null,
											name: extra.userName
										})}
								>
									remove extra
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
	bind:this={extraModal}
	message={pendingExtraRemoval == null
		? 'Remove this entry?'
		: pendingExtraRemoval.characterVersion == null
			? `Remove ${pendingExtraRemoval.name} as an extra from this event?`
			: `Unassign ${pendingExtraRemoval.name} from this extra?`}
	onconfirm={removeExtra}
	oncancel={() => (pendingExtraRemoval = null)}
/>

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

	.assignment {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 0;
	}

	.assignment-name {
		min-width: 180px;
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
