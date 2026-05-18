<script lang="ts">
	import { CirclePlus } from '@lucide/svelte';
	import { type PageProps } from './$types';
	import { dateToHTMLDateTime } from '$lib/utils/time';
	import type { LarpEvent } from '$lib/db/event.repo';

	let { data }: PageProps = $props();
    let events: LarpEvent[] = $state([]);
    $effect(() =>{
        const {events: loadEvents} = data;
        events = loadEvents.map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
        }) as LarpEvent)
    })
</script>

<main>
    <a href="events/new"><CirclePlus /></a>
	<table>
		<thead>
			<tr>
				<th>Id</th>
				<th>Name</th>
				<th>start</th>
				<th>end</th>
				<th>status</th>
			</tr>
		</thead>
        <tbody>
            {#each events as event}
                <tr>
                    <td><a href="events/{event.id}">{event.id}</a></td>
                    <td>{event.name}</td>
                    <td>{dateToHTMLDateTime(event.start)}</td>
                    <td>{dateToHTMLDateTime(event.end)}</td>
                    <td>{event.status}</td>
                </tr>
            {/each}
        </tbody>
	</table>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        justify-content: end;
        align-items: end;
        gap: 8px;
        padding: 16px;
        background-color: white;
    }
    tr {
        border-bottom: 1px solid silver;
    }
    td{
        padding: 16px 8px;
    }
</style>
