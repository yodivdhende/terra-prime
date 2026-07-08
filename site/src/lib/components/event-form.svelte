<script lang="ts">
	import { type LarpEvent } from '$lib/db/event.repo';
	import { EventStatus } from '$lib/types/event-status';
	import { dateToHTMLDateTime } from '$lib/utils/time';

	let { event = $bindable<LarpEvent>() }: { event: LarpEvent } = $props();
	let startDate = $derived(dateToHTMLDateTime(event.start));
	let endDate = $derived(dateToHTMLDateTime(event.end));
	let eventStatuses = Object.values(EventStatus);

	function parseFormId(raw: string): string | null {
		if (!raw.trim()) return null;
		const match = raw.match(/\/forms\/d\/([^/?#]+)/);
		return match ? match[1] : raw.trim();
	}

	function onFormIdInput(e: Event) {
		const value = (e.currentTarget as HTMLInputElement).value;
		event.formId = parseFormId(value) ?? undefined;
	}
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
	<label for="rewardBudget">reward budget</label>
	<input id="rewardBudget" type="number" min="0" step="1" bind:value={event.rewardBudget} />
	<label for="formId">google form id</label>
	<input
		id="formId"
		type="text"
		placeholder="form ID or full Google Forms URL"
		value={event.formId ?? ''}
		oninput={onFormIdInput}
	/>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
