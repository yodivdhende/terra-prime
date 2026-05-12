<script lang="ts">
	import type { StringLarpEvent } from '$lib/db/event.repo';

	let { selectedEventId = $bindable(null) }: { selectedEventId: number | null } = $props();

	let events = $state<StringLarpEvent[]>([]);
	let loading = $state(true);

	async function loadEvents() {
		const res = await fetch('/api/events/open');
		if (res.ok) events = await res.json();
		loading = false;
	}

	$effect(() => {
		loadEvents();
	});

	function formatDate(d: string) {
		return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}
</script>

<div class="events">
	{#if loading}
		<p class="status">loading…</p>
	{:else if events.length === 0}
		<p class="status empty">no open events at this time</p>
	{:else}
		<ul>
			{#each events as event (event.id)}
				<li
					class="event"
					class:selected={selectedEventId === event.id}
					role="option"
					aria-selected={selectedEventId === event.id}
					tabindex="0"
					onclick={() => { selectedEventId = event.id; }}
					onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectedEventId = event.id; }}
				>
					<span class="name">{event.name}</span>
					<span class="dates">{formatDate(event.start)} – {formatDate(event.end)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.events {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.event {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		padding: 0.6rem 0.75rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
		outline: none;
	}

	.event:hover,
	.event:focus {
		border-color: color-mix(in srgb, var(--color-accent) 50%, transparent);
	}

	.event.selected {
		border-color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 8%, transparent);
	}

	.name {
		font-size: 0.8rem;
		letter-spacing: 0.04em;
	}

	.event.selected .name {
		color: var(--color-accent);
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
