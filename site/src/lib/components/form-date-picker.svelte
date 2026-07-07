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

	const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

	let open = $state(false);
	const today = new Date();
	let viewYear = $state(today.getFullYear());
	let viewMonth = $state(today.getMonth());

	$effect(() => {
		if (value) {
			const d = new Date(value + 'T00:00:00');
			if (!isNaN(d.getTime())) {
				viewYear = d.getFullYear();
				viewMonth = d.getMonth();
			}
		}
	});

	let grid = $derived(buildGrid(viewYear, viewMonth));

	function buildGrid(year: number, month: number): (number | null)[] {
		const days = new Date(year, month + 1, 0).getDate();
		const first = new Date(year, month, 1).getDay();
		const cells: (number | null)[] = Array(first).fill(null);
		for (let i = 1; i <= days; i++) cells.push(i);
		while (cells.length % 7 !== 0) cells.push(null);
		return cells;
	}

	let selectedDay = $derived(getSelectedDay(value, viewYear, viewMonth));

	function getSelectedDay(val: string, year: number, month: number): number | null {
		if (!val) return null;
		const d = new Date(val + 'T00:00:00');
		if (isNaN(d.getTime())) return null;
		if (d.getFullYear() === year && d.getMonth() === month) return d.getDate();
		return null;
	}

	function select(day: number) {
		const m = String(viewMonth + 1).padStart(2, '0');
		const d = String(day).padStart(2, '0');
		onchange?.(`${viewYear}-${m}-${d}`);
		open = false;
	}

	function prevMonth() {
		if (viewMonth === 0) { viewMonth = 11; viewYear -= 1; }
		else viewMonth -= 1;
	}

	function nextMonth() {
		if (viewMonth === 11) { viewMonth = 0; viewYear += 1; }
		else viewMonth += 1;
	}

	function formatDisplay(val: string): string {
		if (!val) return '-- --- ----';
		const d = new Date(val + 'T00:00:00');
		if (isNaN(d.getTime())) return val;
		return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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

<div class="date-picker" bind:this={containerEl}>
	<!-- visually hidden native input keeps required constraint validation working -->
	<input
		class="hidden-input"
		type="date"
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
		<div class="calendar">
			<div class="cal-header">
				<button type="button" class="nav" onclick={prevMonth}>‹</button>
				<span class="cal-month">{MONTHS[viewMonth]} {viewYear}</span>
				<button type="button" class="nav" onclick={nextMonth}>›</button>
			</div>

			<div class="cal-grid">
				{#each DAYS as d (d)}
					<span class="day-label">{d}</span>
				{/each}
				{#each grid as cell, i (i)}
					{#if cell === null}
						<span></span>
					{:else}
						<button
							type="button"
							class="day"
							class:selected={cell === selectedDay}
							onclick={() => select(cell)}
						>{cell}</button>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.date-picker {
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

	.calendar {
		position: absolute;
		top: calc(100% + 2px);
		left: 0;
		z-index: 100;
		background: var(--color-bg, #0d0d0d);
		border: 1px solid color-mix(in srgb, var(--color-accent) 40%, transparent);
		padding: 0.5rem;
		min-width: 200px;
	}

	.cal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.4rem;
	}

	.cal-month {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-accent);
	}

	.nav {
		background: transparent;
		border: none;
		color: var(--color-main);
		font-size: 1rem;
		cursor: pointer;
		padding: 0 0.25rem;
		line-height: 1;
		font-family: var(--font-mono);
		transition: color 0.1s;
	}

	.nav:hover {
		color: var(--color-accent);
	}

	.cal-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 1px;
	}

	.day-label {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		text-align: center;
		color: var(--color-main-dim);
		text-transform: uppercase;
		padding: 0.15rem 0;
	}

	.day {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		text-align: center;
		background: transparent;
		border: 1px solid transparent;
		color: var(--color-main);
		cursor: pointer;
		padding: 0.2rem 0;
		transition:
			border-color 0.1s,
			color 0.1s;
	}

	.day:hover {
		border-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
		color: var(--color-accent);
	}

	.day.selected {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
</style>
