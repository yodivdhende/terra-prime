<script lang="ts">
	const SEGMENTS = 10;

	let {
		value = 0,
		color,
		remaining = Infinity,
		cost = 0,
		name = '',
		onchange
	}: {
		value?: number;
		color: string;
		remaining?: number;
		cost?: number;
		name?: string;
		onchange?: (newValue: number) => void;
	} = $props();

	function handleClick(segment: number) {
		const newValue = value === segment ? segment - 1 : segment;
		const costDelta = (newValue - value) * cost;
		if (costDelta > remaining) return;
		onchange?.(newValue);
	}
</script>

<div class="bar">
	{#each { length: SEGMENTS } as _, i}
		{@const segmentValue = i + 1}
		{@const isFilled = value >= segmentValue}
		{@const costToReach = isFilled ? 0 : (segmentValue - value) * cost}
		{@const blocked = !isFilled && costToReach > remaining}
		<button
			class="segment"
			class:filled={isFilled}
			style:--color={color}
			disabled={blocked}
			onclick={() => handleClick(segmentValue)}
			aria-label="Set {name} to {segmentValue * 10}%"
		></button>
	{/each}
</div>

<style>
	.bar {
		display: flex;
		gap: 2px;
	}

	.segment {
		flex: 1;
		height: 10px;
		border: none;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.08);
		cursor: pointer;
		padding: 0;
		transition: background 0.15s;
	}

	.segment:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
	}

	.segment.filled {
		background: var(--color);
	}

	.segment.filled:hover {
		opacity: 0.8;
	}

	.segment:disabled {
		opacity: 0.2;
		cursor: not-allowed;
	}
</style>
