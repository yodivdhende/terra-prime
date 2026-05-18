<script lang="ts">
	import { goto } from '$app/navigation';
	import EventForm from '$lib/components/event-form.svelte';
	import type { PageProps } from './$types';
	import type { LarpEvent } from '$lib/db/event.repo';

	let { data }: PageProps = $props();
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
				await goto('.');
			}
		} catch( err) {
			//TODO make error component;
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
				await goto('.');
			}
		} catch( err) {
			//TODO make error component;
		}
	 }
</script>

<main>
	<a href=".">back</a>
	{#if event != null}
		<EventForm bind:event={ event } />
	{/if}
	<div>
		<button onclick={save}>save</button>
		<button onclick={remove}>delete</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
		background-color: white;
	}
</style>
