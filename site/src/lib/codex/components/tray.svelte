<script lang="ts">
	import { BrainCircuit, Globe, Volume2 } from '@lucide/svelte';
	import { onMount, onDestroy } from 'svelte';

	let time = $state('');

	function tick() {
		const now = new Date();
		const h = String(now.getHours()).padStart(2, '0');
		const m = String(now.getMinutes()).padStart(2, '0');
		time = `${h}:${m}`;
	}

	let interval: ReturnType<typeof setInterval>;
	onMount(() => {
		tick();
		interval = setInterval(tick, 1000);
	});
	onDestroy(() => clearInterval(interval));
</script>

<div class="tray">
	<Globe size={32} />
	<Volume2 size={32} />
	<BrainCircuit size={32} />
	<span class="clock">{time}</span>
</div>

<style>
	.tray {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 0.75rem;
		height: 100%;
	}

	.tray svg {
		width: 32px;
		height: 32px;
		opacity: 0.7;
		flex-shrink: 0;
	}

	.clock {
		font-family: var(--font-mono);
		font-size: 1.5rem;
		letter-spacing: 0.08em;
		opacity: 0.85;
		white-space: nowrap;
	}
</style>
