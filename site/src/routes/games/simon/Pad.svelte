<script lang="ts">
	let {
		label,
		lit,
		color,
		glow,
		onactivate
	}: {
		label: string;
		lit: boolean;
		color: string;
		glow: string;
		onactivate: () => void;
	} = $props();
</script>

<button type="button" class="pad" class:lit onclick={onactivate} style:--pad-color={color} style:--pad-glow={glow}>
	<span>{label}</span>
</button>

<style>
	.pad {
		width: 100%;
		aspect-ratio: 1;
		background: transparent;
		border: var(--border-width) solid color-mix(in srgb, var(--pad-color) 45%, transparent);
		border-radius: var(--border-radius);
		color: color-mix(in srgb, var(--pad-color) 75%, transparent);
		font-family: var(--font-mono);
		font-size: clamp(1.5rem, 4vw, 2.4rem);
		font-weight: bold;
		cursor: pointer;
		transition:
			border-color 0.08s ease-out,
			background-color 0.08s ease-out,
			box-shadow 0.08s ease-out,
			color 0.08s ease-out;
	}

	.pad:hover {
		border-color: color-mix(in srgb, var(--pad-color) 70%, transparent);
	}

	.pad.lit {
		border-color: var(--pad-glow);
		color: var(--color-main);
		background: color-mix(in srgb, var(--pad-color) 25%, transparent);
		box-shadow:
			0 0 4px var(--pad-glow),
			0 0 10px var(--pad-glow),
			0 0 24px color-mix(in srgb, var(--pad-glow) 45%, transparent);
	}
</style>
