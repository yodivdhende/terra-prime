<script lang="ts">
	let {
		value = 0,
		color,
		remaining = Infinity,
		cost = 0,
		name = '',
		max = 10,
		onchange
	}: {
		value?: number;
		color: string;
		remaining?: number;
		cost?: number;
		name?: string;
		max?: number;
		onchange?: (newValue: number) => void;
	} = $props();

	const fill = $derived(max > 0 ? Math.min(Math.max(value, 0) / max, 1) * 100 : 0);

	function handleInput(e: Event & { currentTarget: HTMLInputElement }) {
		const raw = Number(e.currentTarget.value);
		const costDelta = (raw - value) * cost;
		let newValue = raw;
		if (costDelta > remaining) {
			newValue = cost > 0 ? value + Math.floor(remaining / cost) : raw;
			newValue = Math.max(0, Math.min(max, newValue));
		}
		onchange?.(newValue);
	}
</script>

<input
	class="slider"
	type="range"
	style:--color={color}
	style:--tp-fill={fill}
	min={0}
	{max}
	step={1}
	{value}
	oninput={handleInput}
	aria-label="Set {name} level"
/>

<style>
	.slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: linear-gradient(
			to right,
			var(--color) calc(var(--tp-fill, 0) * 1%),
			rgba(255, 255, 255, 0.1) calc(var(--tp-fill, 0) * 1%)
		);
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--color);
		border: none;
		cursor: pointer;
	}

	.slider::-moz-range-thumb {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--color);
		border: none;
		cursor: pointer;
	}

	.slider::-moz-range-track {
		height: 6px;
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.1);
	}

	.slider::-moz-range-progress {
		height: 6px;
		border-radius: 3px;
		background: var(--color);
	}
</style>
