<script lang="ts">
	import { goto, invalidate } from "$app/navigation";
	import EventForm from "$lib/components/event-form.svelte";
	import type { LarpEvent } from "$lib/db/event.repo";
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

    let event: LarpEvent = $state({
        id: null,
        name: '',
        start: new Date(),
        end: new Date(),
		status: 'Draft',
    });

   async function save(){
        try {
            const response = await fetch('/api/events', {
                method: 'put',
                body: JSON.stringify(event),
            })
            if(response.ok){
                TOAST_MANAGER.success('Event created');
                await invalidate('/api/events');
                await goto('.');
            }
        } catch (err: any) {
            TOAST_MANAGER.error(err.message ?? 'Something went wrong');
        }
    }

</script>

<main>
	<a href=".">back</a>
	<h1>new event</h1>
	{#if event != null}
		<EventForm bind:event={event}  />
	{/if}
	<div>
		<button onclick={save}>save</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
	}
</style>
