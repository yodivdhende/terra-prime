<script lang="ts">
	import { type LarpEvent } from '$lib/db/event.repo';
	import { EventStatus } from '$lib/types/event-status';
	import { dateToHTMLDateTime } from '$lib/utils/time';

	let { event = $bindable<LarpEvent>() }: { event: LarpEvent } = $props();
	let startDate = $derived(dateToHTMLDateTime(event.start));
	let endDate = $derived(dateToHTMLDateTime(event.end));
	// const EventStatus = {
	// 	Draft: 'Draft',
	// 	Open: 'Open',
	// 	Live: 'Live',
	// 	Canceled: 'Canceled'
	// } as const;
	let eventStatuses = Object.values(EventStatus);
</script>

<main>
	<label for="name">name</label>
	<input id="name" type="text" bind:value={event.name} />
	<label for="start">start</label>
	<input
		type="date"
		bind:value={() => startDate, (value) => (event.start = new Date(value))}
	/>
	<label for="end">end</label>
	<input
		type="date"
		bind:value={() => endDate, (value) => (event.end = new Date(value))}
	/>
	<select id="status" bind:value={event.status}>
		{#each eventStatuses as status}
			<option value={status}>{status}</option>
		{/each}
	</select>
	<label for="budget">budget</label>
	<input id="budget" type="number" min="0" step="0.01" bind:value={event.budget} />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
