<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import EventForm from '$lib/components/event-form.svelte';
	import CharacterVersionPreview from '$lib/components/character-version-preview.svelte';
	import type { PageProps } from './$types';
	import type { LarpEvent } from '$lib/db/event.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();
	const participants = $derived(data.participants ?? []);
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
			<a href={resolve('/manage/events/[id]/coupons', { id: String(event.id) })}>Manage Coupons →</a>
		{/if}
		<h2>Participants</h2>
		{#if participants.length === 0}
			<p class="status">No participants registered for this event.</p>
		{:else}
			<table>
				<thead>
					<tr>
						<th>Character</th>
						<th>Owner</th>
						<th>Version</th>
						<th>Overview</th>
					</tr>
				</thead>
				<tbody>
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
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>
</main>

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

	.status {
		font-size: 0.8rem;
		opacity: 0.5;
	}
</style>
