<script lang="ts">
	let {
		src,
		color = 'currentColor',
		tooltip = '',
		size = '1.2rem'
	}: {
		src: string;
		color?: string;
		tooltip?: string;
		size?: string;
	} = $props();

	const svg = $derived(
		src
			.replace(/\sstyle="[^"]*"/g, '')
			.replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"')
	);
</script>

<span
	class="icon"
	class:has-tooltip={tooltip}
	style="color: {color}; --icon-size: {size};"
	aria-label={tooltip || undefined}
	data-tooltip={tooltip || undefined}
>
	{@html svg}
</span>

<style>
	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--icon-size);
		height: var(--icon-size);
		flex-shrink: 0;
	}

	.icon :global(svg) {
		width: 100%;
		height: 100%;
	}

	.has-tooltip {
		position: relative;
		cursor: default;
	}

	.has-tooltip::after {
		content: attr(data-tooltip);
		position: absolute;
		bottom: calc(100% + 0.4rem);
		left: 50%;
		transform: translateX(-50%);
		white-space: nowrap;
		background: var(--color-bg, #000);
		color: var(--color-main, #fff);
		border: 1px solid currentColor;
		font-family: var(--font-mono, monospace);
		font-size: 0.65rem;
		letter-spacing: 0.05em;
		padding: 0.2rem 0.45rem;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.15s;
	}

	.has-tooltip:hover::after {
		opacity: 1;
	}
</style>
