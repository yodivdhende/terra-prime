<script lang="ts">
	let {
		value = 0,
		max = 10,
		color,
		name = '',
		width = 20
	}: {
		value?: number;
		max?: number;
		color: string;
		name?: string;
		width?: number;
	} = $props();

	const filledChars = $derived(
		max > 0 ? Math.round((Math.min(Math.max(value, 0), max) / max) * width) : 0
	);
	const emptyChars = $derived(width - filledChars);
</script>

<span
	class="bar"
	role="progressbar"
	aria-valuenow={value}
	aria-valuemin={0}
	aria-valuemax={max}
	aria-label="{name} level"
>
	<span aria-hidden="true"
		>[<span class="filled" style:color>{'#'.repeat(filledChars)}</span><span class="empty"
			>{'.'.repeat(emptyChars)}</span
		>]</span
	>
</span>

<style>
	.bar {
		font-family: var(--font-mono);
		white-space: pre;
	}

	.empty {
		opacity: 0.3;
	}
</style>
