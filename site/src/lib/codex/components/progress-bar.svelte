<script lang="ts">
	let {
		value = 0,
		max = 10,
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
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		overflow: hidden;
	}

	.fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.2s;
	}
</style>
