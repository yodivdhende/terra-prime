<script lang="ts">
	import type { StringLarpEvent } from '$lib/db/event.repo';

	let { selectedEventId = $bindable(null) }: { selectedEventId: number | null } = $props();

	let event = $state<StringLarpEvent | null>(null);
	let loading = $state(true);

	async function loadEvent() {
		const res = await fetch('/api/events/open');
		if (res.ok) {
			const events: StringLarpEvent[] = await res.json();
			event = events[0] ?? null;
			selectedEventId = event?.id ?? null;
		}
		loading = false;
	}

	$effect(() => {
		loadEvent();
	});

	function formatDate(d: string) {
		return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}
</script>

<div class="events">
	{#if loading}
		<p class="status">loading…</p>
	{:else if !event}
		<p class="status empty">no open events at this time</p>
	{:else}
		<div class="event">
			<span class="name">{event.name}</span>
			<span class="dates">{formatDate(event.start)} – {formatDate(event.end)}</span>
		</div>
	{/if}
</div>

<style>
	.events {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.event {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		padding: 0.6rem 0.75rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
	}

	.name {
		font-size: 0.8rem;
		letter-spacing: 0.04em;
	}

	.dates {
		font-size: 0.7rem;
		opacity: 0.5;
		white-space: nowrap;
	}

	.status {
		font-size: 0.75rem;
		opacity: 0.4;
	}

	.status.empty {
		font-style: italic;
	}
</style>
