<script lang="ts">
	import { goto } from '$app/navigation';
	import EventForm from '$lib/components/event-form.svelte';
	import CharacterVersionPreview from '$lib/components/character-version-preview.svelte';
	import type { PageProps } from './$types';
	import type { LarpEvent } from '$lib/db/event.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();
	const participants = $derived(data.participants ?? []);
	let event: LarpEvent | null = $state(null);
	$effect(()=> {
		const {event:loadEvent} = data;
		const result: LarpEvent = {
			...loadEvent,
			start: new Date(loadEvent.start),
			end: new Date(loadEvent.end),
		}
		event = result;
	})

	async function save() {
		const eventToSave = $state.snapshot(event);
		if(eventToSave == null) return;
		const {id: eventId} = eventToSave;
		if(eventId == null) return;
		try {
			const result = await fetch(`/api/events/${eventId}`, {
				method: 'post',
				body: JSON.stringify(eventToSave),
				headers: {
					'content-type': 'application/json',
				}
			})
			if(result.ok) {
				TOAST_MANAGER.success('Event saved');
				await goto('.');
			}
		} catch( err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
    }

	async function remove() {
		const eventToSave = $state.snapshot(event);
		if(eventToSave == null) return;
		const {id: eventId} = eventToSave;
		if(eventId == null) return;
		try {
			const result = await fetch(`/api/events/${eventId}`, {
				method: 'delete',
				headers: {
					'content-type': 'application/json',
				}
			})
			if(result.ok) {
				TOAST_MANAGER.success('Event deleted');
				await goto('.');
			}
		} catch( err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
	 }
</script>

<main>
	<a href=".">back</a>
	{#if event != null}
		<EventForm bind:event={ event } />
	{/if}
	<div>
		<button class="btn" onclick={save}>save</button>
		<button class="btn btn-danger" onclick={remove}>delete</button>
	</div>
	{#if event?.id != null}
		<a href="{event.id}/budget">Manage Budget →</a>
	{/if}

	<section class="participants">
		<h2>Participants</h2>
		{#if participants.length === 0}
			<p class="status">No participants registered for this event.</p>
		{:else}
			{#each participants as { character, version } (character.id)}
				<div class="participant">
					<h3>{character.name} <span class="owner">({character.ownerName})</span></h3>
					{#if version != null}
						<p class="version-name">{version.name}</p>
						<CharacterVersionPreview
							expertise={version.expertise}
							items={version.items}
							implants={version.implants}
						/>
					{:else}
						<p class="status">version not found</p>
					{/if}
				</div>
			{/each}
		{/if}
	</section>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
	}

	.participants {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 12px;
	}

	.participant {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.participant h3 {
		margin: 0;
	}

	.owner {
		opacity: 0.6;
		font-weight: normal;
	}

	.version-name {
		margin: 0;
		opacity: 0.8;
		font-size: 0.9rem;
	}

	.status {
		font-size: 0.8rem;
		opacity: 0.5;
	}
</style>
