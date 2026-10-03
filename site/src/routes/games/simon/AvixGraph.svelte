<script lang="ts">
	import { AVIX_NORMAL, AVIX_SCALE_MAX, type AvixPoint } from '$lib/games/simon/dossiers';

	let {
		series,
		lost,
		subject
	}: { series: AvixPoint[]; lost?: { date: string; label: string }; subject: string } = $props();

	const W = 600;
	const H = 230;
	const M = { top: 18, right: 24, bottom: 34, left: 46 };
	const X_FIRST = 1; // 01.11
	const X_LAST = 44; // 14.12
	const Y_TICKS = [0, 10, 20, 30, 40, 50, 60, 70];
	const X_TICKS = ['03.11', '10.11', '20.11', '28.11', '05.12', '12.12'];

	/** `dd.mm` → day index counted from 1 November 1966. */
	function dayOf(date: string): number {
		const [day, month] = date.split('.').map(Number);
		return month === 12 ? 30 + day : day;
	}

	const x = (date: string) =>
		M.left + ((dayOf(date) - X_FIRST) / (X_LAST - X_FIRST)) * (W - M.left - M.right);
	const y = (value: number) => H - M.bottom - (value / AVIX_SCALE_MAX) * (H - M.top - M.bottom);
	const fmt = (value: number) => value.toFixed(1).replace('.', ',');

	const path = $derived(series.map((p) => `${x(p.date)},${y(p.value)}`).join(' '));
	const lastPoint = $derived(series[series.length - 1]);

	let hovered = $state<number | null>(null);
</script>

<figure class="avix-graph">
	<figcaption>AVIX-VERLOOP IN HET BLOED · {subject}</figcaption>
	<svg viewBox="0 0 {W} {H}" role="img" aria-labelledby="avix-title">
		<title id="avix-title">
			AVIX-waarden van {subject}: {series.map((p) => `${p.date} ${fmt(p.value)}`).join(', ')}
		</title>

		{#each Y_TICKS as tick (tick)}
			<line class="grid" x1={M.left} x2={W - M.right} y1={y(tick)} y2={y(tick)} />
			<text class="axis" x={M.left - 8} y={y(tick) + 4} text-anchor="end">{tick}</text>
		{/each}
		{#each X_TICKS as tick (tick)}
			<text class="axis" x={x(tick)} y={H - M.bottom + 18} text-anchor="middle">{tick}</text>
		{/each}
		<text class="axis unit" x={M.left} y={M.top - 6}>E/ml</text>

		<line class="normal" x1={M.left} x2={W - M.right} y1={y(AVIX_NORMAL)} y2={y(AVIX_NORMAL)} />
		<text class="normal-label" x={W - M.right} y={y(AVIX_NORMAL) - 6} text-anchor="end">
			NORMAAL &lt; 0,3
		</text>

		{#if lost}
			<line
				class="lost-tail"
				x1={x(lost.date)}
				x2={W - M.right}
				y1={y(lastPoint.value)}
				y2={y(lastPoint.value)}
			/>
			<text class="lost-label" x={W - M.right} y={y(lastPoint.value) + 18} text-anchor="end">
				GEEN METINGEN — VERDWENEN
			</text>
		{/if}

		<polyline class="line" points={path} />

		{#each series as point, i (point.date)}
			{@const px = x(point.date)}
			{@const py = y(point.value)}
			<rect
				class="marker"
				class:active={hovered === i}
				x={px - 4}
				y={py - 4}
				width="8"
				height="8"
			/>
			{#if point.note || i === series.length - 1 || hovered === i}
				<text class="value" x={px} y={py - 12} text-anchor="middle">{fmt(point.value)}</text>
			{/if}
			<rect
				class="hit"
				x={px - 16}
				y={M.top}
				width="32"
				height={H - M.top - M.bottom}
				role="presentation"
				onpointerenter={() => (hovered = i)}
				onpointerleave={() => (hovered = null)}
			/>
		{/each}

		{#if lost}
			{@const lx = x(lost.date)}
			{@const ly = y(lastPoint.value)}
			<g class="lost-mark">
				<line x1={lx + 8} y1={ly - 6} x2={lx + 20} y2={ly + 6} />
				<line x1={lx + 8} y1={ly + 6} x2={lx + 20} y2={ly - 6} />
			</g>
			<text class="lost-label" x={lx + 26} y={ly - 10}>{lost.label}</text>
		{/if}
	</svg>
	<p class="readout">
		{#if hovered !== null}
			&gt; {series[hovered].date}.66 · AVIX {fmt(series[hovered].value)} E/ml{series[hovered].note
				? ` · ${series[hovered].note}`
				: ''}
		{:else}
			&gt; beweeg over de meetpunten voor details
		{/if}
	</p>
</figure>

<style>
	.avix-graph {
		margin: 0.5rem 0 0.75rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		padding: 0.5rem 0.75rem;
	}

	figcaption,
	.readout {
		font-size: 0.75em;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-main-dim);
	}

	.readout {
		min-height: 1.4em;
		color: var(--color-accent);
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		font-family: var(--font-mono);
	}

	.grid {
		stroke: var(--border-color-dim);
		stroke-width: 1;
		stroke-dasharray: 2 4;
		opacity: 0.6;
	}

	.axis {
		fill: var(--color-main-dim);
		font-size: 11px;
	}

	.normal {
		stroke: var(--color-warning);
		stroke-width: 1.5;
		stroke-dasharray: 6 4;
	}

	.normal-label,
	.lost-label {
		fill: var(--color-warning);
		font-size: 11px;
		letter-spacing: 0.06em;
	}

	.line {
		fill: none;
		stroke: var(--color-accent);
		stroke-width: 2;
		stroke-linejoin: round;
		filter: drop-shadow(0 0 3px #00ff41);
	}

	.marker {
		fill: var(--color-bg);
		stroke: var(--color-accent);
		stroke-width: 2;
	}

	.marker.active {
		fill: var(--color-accent);
	}

	.value {
		fill: var(--color-main);
		font-size: 11px;
	}

	.hit {
		fill: transparent;
		cursor: crosshair;
	}

	.lost-tail {
		stroke: var(--color-warning);
		stroke-width: 1.5;
		stroke-dasharray: 1 5;
		stroke-linecap: round;
	}

	.lost-mark line {
		stroke: var(--color-warning);
		stroke-width: 2;
	}
</style>
