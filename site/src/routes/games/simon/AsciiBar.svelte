<script lang="ts">
	/** `[####........]` — mirrors `ascii-progress-bar.svelte` and the pygame
	 * port's `ascii_progress_bar`: filled cells full opacity, empty cells dimmed. */
	let {
		value,
		max,
		width = 20,
		color = 'var(--color-accent)'
	}: { value: number; max: number; width?: number; color?: string } = $props();

	const filled = $derived(
		max > 0 ? Math.round(Math.max(0, Math.min(1, value / max)) * width) : 0
	);
	const empty = $derived(Math.max(0, width - filled));
</script>

<span class="ascii-bar" style:color
	>[<span class="filled">{'#'.repeat(filled)}</span><span class="empty">{'.'.repeat(empty)}</span
	>]</span
>

<style>
	.ascii-bar {
		font-family: var(--font-mono);
		white-space: pre;
		letter-spacing: 0.05em;
	}

	.empty {
		opacity: 0.3;
	}
</style>
