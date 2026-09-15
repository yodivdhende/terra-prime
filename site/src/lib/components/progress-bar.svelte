<script lang="ts">
	let {
		value = 0,
		max = 100,
		color,
		name = ''
	}: {
		value?: number;
		max?: number;
		color: string;
		name?: string;
	} = $props();

	const fill = $derived(max > 0 ? Math.min(Math.max(value, 0) / max, 1) * 100 : 0);
</script>

<div
	class="track"
	role="progressbar"
	aria-valuenow={value}
	aria-valuemin={0}
	aria-valuemax={max}
	aria-label="{name} level"
>
	<div class="fill" style:width="{fill}%" style:background={color}></div>
</div>

<style>
	.track {
		height: 6px;
		/* Overridable by any ancestor, e.g. a light-background or print surface. */
		background: var(--progress-track, rgba(255, 255, 255, 0.1));
		border-radius: 3px;
		overflow: hidden;
		/* Browsers drop background colours when printing; without this every bar prints empty. */
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
	}

	.fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.2s;
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
	}
</style>
