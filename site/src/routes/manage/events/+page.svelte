<script lang="ts">
	import { CirclePlus } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { type PageProps } from './$types';
	import { dateToHTMLDateTime } from '$lib/utils/time';
	import type { LarpEvent } from '$lib/db/event.repo';
	import DataTable from '$lib/components/data-table.svelte';

	let { data }: PageProps = $props();

	let events: LarpEvent[] = $state([]);
	$effect(() => {
		const { events: loadEvents } = data;
		events = loadEvents.map(
			(event) =>
				({
					...event,
					start: new Date(event.start),
					end: new Date(event.end)
				}) as LarpEvent
		);
	});

	let displayEvents = $derived(
		events.map((e) => ({
			...e,
			start: dateToHTMLDateTime(e.start),
			end: dateToHTMLDateTime(e.end)
		}))
	);

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Name', key: 'name' },
		{ label: 'Start', key: 'start' },
		{ label: 'End', key: 'end' },
		{ label: 'Status', key: 'status' },
		{ label: 'Budget', key: 'budget' }
	];
</script>

<main>
	<a href={resolve('/manage/events/new')}><CirclePlus /></a>
	<DataTable items={displayEvents} {columns}>
		{#snippet row(item)}
			<tr>
				<td><a href={resolve('/manage/events/[id]', { id: String(item.id) })}>{item.id}</a></td>
				<td>{item.name}</td>
				<td>{item.start}</td>
				<td>{item.end}</td>
				<td>{item.status}</td>
				<td>{item.budget ?? '—'}</td>
			</tr>
		{/snippet}
	</DataTable>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		justify-content: end;
		align-items: end;
		gap: 8px;
		padding: 16px;
	}
</style>
