<script lang="ts">
	let {
		required = false,
		value = '',
		onchange
	}: {
		required?: boolean;
		value?: string;
		onchange?: (value: string) => void;
	} = $props();

	const HOURS = Array.from({ length: 24 }, (_, i) => i);
	const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

	let open = $state(false);

	let selectedHour = $derived(parseHour(value));
	let selectedMinute = $derived(parseMinute(value));

	function parseHour(val: string): number | null {
		if (!val) return null;
		const h = parseInt(val.split(':')[0], 10);
		return isNaN(h) ? null : h;
	}

	function parseMinute(val: string): number | null {
		if (!val) return null;
		const m = parseInt(val.split(':')[1], 10);
		return isNaN(m) ? null : m;
	}

	function select(h: number | null, m: number | null) {
		const hour = h ?? selectedHour ?? 0;
		const minute = m ?? selectedMinute ?? 0;
		const newVal = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
		onchange?.(newVal);
	}

	function formatDisplay(val: string): string {
		if (!val) return '--:--';
		const [h, m] = val.split(':');
		if (!h || !m) return '--:--';
		return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
	}

	let containerEl = $state<HTMLDivElement | null>(null);

	function handleMousedown(e: MouseEvent) {
		if (containerEl && !containerEl.contains(e.target as Node)) open = false;
	}

	$effect(() => {
		if (open) {
			document.addEventListener('mousedown', handleMousedown);
			return () => document.removeEventListener('mousedown', handleMousedown);
		}
	});
</script>

<div class="time-picker" bind:this={containerEl}>
	<input
		class="hidden-input"
		type="time"
		tabindex="-1"
		aria-hidden="true"
		{required}
		{value}
	/>

	<button
		type="button"
		class="display"
		class:open
		onclick={(e) => { e.stopPropagation(); open = !open; }}
	>
		<span>{formatDisplay(value)}</span>
		<span class="caret">{open ? '▲' : '▼'}</span>
	</button>

	{#if open}
		<div class="dropdown">
			<div class="col-header">
				<span>HH</span>
				<span>MM</span>
			</div>
			<div class="columns">
				<div class="col">
					{#each HOURS as h (h)}
						<button
							type="button"
							class="cell"
							class:selected={h === selectedHour}
							onclick={() => select(h, null)}
						>{String(h).padStart(2, '0')}</button>
					{/each}
				</div>
				<div class="divider">:</div>
				<div class="col">
					{#each MINUTES as m (m)}
						<button
							type="button"
							class="cell"
							class:selected={selectedMinute !== null && m === Math.floor(selectedMinute / 5) * 5}
							onclick={() => select(null, m)}
						>{String(m).padStart(2, '0')}</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.time-picker {
		position: relative;
		display: inline-block;
		width: 100%;
		margin-top: 0.25rem;
	}

	.hidden-input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
		top: 0;
		left: 0;
	}

	.display {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		color: var(--color-main);
		font-family: var(--font-mono);
		font-size: 0.85rem;
		padding: 0.3rem 0.5rem;
		cursor: pointer;
		text-align: left;
		transition: border-color 0.15s;
		letter-spacing: normal;
		text-transform: none;
	}

	.display:hover,
	.display.open {
		border-color: var(--color-accent);
	}

	.caret {
		font-size: 0.6rem;
		opacity: 0.6;
		margin-left: 0.5rem;
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 2px);
		left: 0;
		z-index: 100;
		background: var(--color-bg, #0d0d0d);
		border: 1px solid color-mix(in srgb, var(--color-accent) 40%, transparent);
		padding: 0.4rem;
	}

	.col-header {
		display: flex;
		justify-content: space-around;
		font-family: var(--font-mono);
		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-accent);
		margin-bottom: 0.25rem;
		padding: 0 0.25rem;
	}

	.columns {
		display: flex;
		align-items: flex-start;
		gap: 0.15rem;
	}

	.col {
		display: flex;
		flex-direction: column;
		max-height: 160px;
		overflow-y: auto;
		scrollbar-width: none;
	}

	.col::-webkit-scrollbar {
		display: none;
	}

	.divider {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--color-main-dim);
		padding: 0.15rem 0.1rem;
		align-self: flex-start;
		margin-top: 0.1rem;
	}

	.cell {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		background: transparent;
		border: 1px solid transparent;
		color: var(--color-main);
		cursor: pointer;
		padding: 0.15rem 0.4rem;
		text-align: center;
		transition:
			border-color 0.1s,
			color 0.1s;
		min-width: 2.2rem;
	}

	.cell:hover {
		border-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
		color: var(--color-accent);
	}

	.cell.selected {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
</style>
