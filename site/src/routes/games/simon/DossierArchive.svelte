<script lang="ts">
	import {
		ARCHIVE,
		AVIX_SCALE_MAX,
		DOSSIER_HEADER,
		DOSSIER_SIGNATURE,
		corruptLines,
		type ArchiveEntry,
		type DossierLine
	} from '$lib/games/simon/dossiers';
	import AsciiBar from './AsciiBar.svelte';
	import AvixGraph from './AvixGraph.svelte';

	/** Mirrors `$lib/components/dir-window.svelte`, but over the static Vostok-9 archive. */

	type FileEntry = Exclude<ArchiveEntry, { kind: 'folder' }>;

	let expanded = $state<Record<string, boolean>>(
		Object.fromEntries(ARCHIVE.map((entry) => [entry.id, true]))
	);
	let selected = $state<FileEntry | null>(null);
	let cursor = $state(0);

	const visible = $derived.by(() => {
		const rows: { entry: ArchiveEntry; depth: number }[] = [];
		const walk = (entries: ArchiveEntry[], depth: number) => {
			for (const entry of entries) {
				rows.push({ entry, depth });
				if (entry.kind === 'folder' && expanded[entry.id]) walk(entry.children, depth + 1);
			}
		};
		walk(ARCHIVE, 0);
		return rows;
	});

	function activate(entry: ArchiveEntry) {
		cursor = visible.findIndex((row) => row.entry.id === entry.id);
		if (entry.kind === 'folder') expanded = { ...expanded, [entry.id]: !expanded[entry.id] };
		else selected = entry;
	}

	function onKeydown(event: KeyboardEvent) {
		const row = visible[cursor];
		if (event.key === 'ArrowDown') cursor = Math.min(visible.length - 1, cursor + 1);
		else if (event.key === 'ArrowUp') cursor = Math.max(0, cursor - 1);
		else if ((event.key === 'Enter' || event.key === 'ArrowRight') && row) activate(row.entry);
		else if (event.key === 'ArrowLeft' && row?.entry.kind === 'folder')
			expanded = { ...expanded, [row.entry.id]: false };
		else return;
		event.preventDefault();
	}

	const leader = (label: string, width = 22) =>
		`${label.toUpperCase()}${'.'.repeat(Math.max(2, width - label.length))}: `;
	const fmt = (value: number) => value.toFixed(1).replace('.', ',');
</script>

<svelte:window onkeydown={onKeydown} />

<div class="archive">
	<div class="tree">
		<span class="root">/VOSTOK-9/ARCHIEF</span>
		{#each visible as row, i (row.entry.id)}
			<button
				class="entry {row.entry.kind}"
				class:active={selected?.id === row.entry.id}
				class:cursor={cursor === i}
				style:padding-left="{0.75 + row.depth * 1}rem"
				onclick={() => activate(row.entry)}
			>
				{#if row.entry.kind === 'folder'}
					<span class="arrow">{expanded[row.entry.id] ? 'v' : '>'}</span>
				{/if}
				<span class="name">{row.entry.name}</span>
				{#if row.entry.kind === 'corrupt'}<span class="flag">!</span>{/if}
			</button>
		{/each}
	</div>

	<div class="preview">
		{#if selected == null}
			<span class="status">selecteer een bestand &middot; [&uarr;][&darr;] [enter]</span>
		{:else}
			{#key selected.id}
				<article class="doc">
					{#if selected.kind === 'corrupt'}
						<p class="warning">[FOUT] SECTOR BESCHADIGD — CRC-CONTROLE MISLUKT</p>
						<p class="dim">BESTAND: {selected.name} · {selected.size} · 0 BYTES LEESBAAR</p>
						<pre class="noise">{corruptLines(selected.id).join('\n')}</pre>
						<p class="warning">ONLEESBAAR — HERSTEL NIET MOGELIJK</p>
					{:else}
						{@const doc = selected.dossier}
						<header>
							{#each DOSSIER_HEADER as line, i (i)}
								<p class:secret={i === 0}>{line}</p>
							{/each}
						</header>

						<h2>== I. OPNAMEFICHE ==</h2>
						{#each doc.fields as [label, value] (label)}
							<p class="field"><span class="dim">{leader(label)}</span>{value}</p>
						{/each}

						<section class="avix">
							<h2>== BLOEDANALYSE: AVIX ==</h2>
							<p class="avix-value">
								AVIX-WAARDE: <span class="glow">{fmt(doc.avix.value)} E/ml</span>
								<AsciiBar value={doc.avix.value} max={AVIX_SCALE_MAX} width={28} />
							</p>
							<p class="dim">
								NORMAAL &lt; 0,3 E/ml · KLASSE {doc.avix.category} · VERHOUDING &times;{Math.round(
									doc.avix.value / 0.3
								)}
							</p>
							<AvixGraph
								series={doc.avix.series}
								lost={doc.avix.lost}
								subject={doc.fields[2][1].toUpperCase()}
							/>
							{#each doc.avix.lines as line, i (i)}
								{@render docLine(line)}
							{/each}
						</section>

						{#each doc.sections as section (section.title)}
							<h2>== {section.title.toUpperCase()} ==</h2>
							{#each section.lines as line, i (i)}
								{@render docLine(line)}
							{/each}
						{/each}

						<h2>== IV. KLINISCH REGISTER ==</h2>
						{#each doc.log as entry (entry.stamp)}
							<div class="log" class:highlight={entry.highlight}>
								<p class="stamp">
									[{entry.stamp}] <span class="dim">{entry.vitals} · PAR. {entry.initials}</span>
								</p>
								<p><span class="dim">WAARNEMING:&nbsp;</span>{entry.observation}</p>
								<p><span class="dim">HANDELING :&nbsp;</span>{entry.action}</p>
							</div>
						{/each}

						<h2>== V. BEOORDELING & EINDBESTEMMING ==</h2>
						{#each doc.assessment as line, i (i)}
							{@render docLine(line)}
						{/each}

						<footer>
							{#each DOSSIER_SIGNATURE as line, i (i)}
								<p class:dim={i > 1}>{line}</p>
							{/each}
							<p class="dim">-- EINDE BESTAND --</p>
						</footer>
					{/if}
				</article>
			{/key}
		{/if}
	</div>
</div>

{#snippet docLine(line: DossierLine)}
	<p class="line" class:highlight={line.highlight}>
		<span class="prefix">{line.highlight ? '>>' : '> '}</span>
		<span>
			{#if line.label}<span class="dim">{line.label.toUpperCase()}:&nbsp;</span>{/if}{line.text}
		</span>
	</p>
{/snippet}

<style>
	.archive {
		display: grid;
		grid-template-columns: minmax(14rem, 1fr) 2.5fr;
		height: 100%;
		min-height: 0;
		overflow: hidden;
		text-align: left;
	}

	.tree {
		border-right: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		overflow-y: auto;
		padding: 0.5rem 0;
		display: flex;
		flex-direction: column;
	}

	.root {
		padding: 0.25rem 0.75rem 0.5rem;
		font-size: 0.7em;
		letter-spacing: 0.08em;
		color: var(--color-main-dim);
	}

	.entry {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.25rem 0.75rem;
		background: none;
		border: none;
		color: var(--color-main);
		font-family: inherit;
		font-size: 0.75em;
		text-align: left;
		cursor: pointer;
		width: 100%;
		letter-spacing: 0.03em;
		opacity: 0.75;
		transition: opacity 0.1s;
	}

	.entry:hover,
	.entry.cursor {
		opacity: 1;
	}

	.entry.cursor {
		background: color-mix(in srgb, var(--color-accent) 12%, transparent);
	}

	.entry.active {
		opacity: 1;
		color: var(--color-accent);
	}

	.entry.corrupt .name {
		text-decoration: line-through;
		text-decoration-color: color-mix(in srgb, var(--color-warning) 60%, transparent);
	}

	.flag {
		color: var(--color-warning);
		margin-left: auto;
	}

	.arrow {
		font-size: 0.65em;
		flex-shrink: 0;
		opacity: 0.6;
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.preview {
		overflow-y: auto;
		min-height: 0;
	}

	.status {
		display: block;
		padding: 0.75rem;
		opacity: 0.4;
		font-size: 0.7em;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.doc {
		padding: 1rem 1.25rem 2rem;
		font-size: 0.85em;
		line-height: 1.45;
	}

	/* Top-down stepped reveal — the dossier "arrives" over the wire. */
	.doc {
		animation: print 1.2s steps(30) both;
	}
	@keyframes print {
		from {
			clip-path: inset(0 0 100% 0);
		}
		to {
			clip-path: inset(0 0 0 0);
		}
	}

	header {
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		padding: 0.5rem 0.75rem;
		margin-bottom: 0.75rem;
		text-align: center;
		letter-spacing: 0.06em;
	}

	.secret {
		color: var(--color-warning);
		font-weight: bold;
	}

	h2 {
		color: var(--color-accent);
		font-size: 1em;
		letter-spacing: 0.06em;
		margin: 1rem 0 0.4rem;
	}

	.field {
		white-space: pre-wrap;
	}

	.dim {
		color: var(--color-main-dim);
	}

	.avix {
		border-left: 2px solid var(--color-accent);
		padding-left: 0.75rem;
		margin: 0.5rem 0;
	}

	.avix-value {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75em;
		align-items: baseline;
		font-size: 1.1em;
	}

	.glow {
		color: var(--color-accent);
		text-shadow:
			0 0 4px #00ff41,
			0 0 10px #00ff41,
			0 0 20px #003b00;
	}

	.line {
		display: flex;
		gap: 0.5em;
		margin-bottom: 0.35rem;
	}

	.prefix {
		flex-shrink: 0;
		color: var(--color-main-dim);
	}

	.highlight .prefix,
	.line.highlight {
		color: var(--color-accent);
	}

	.line.highlight .prefix {
		text-shadow: 0 0 6px #00ff41;
	}

	.log {
		margin: 0 0 0.6rem;
		padding-left: 0.75rem;
		border-left: 1px solid var(--border-color-dim);
	}

	.log.highlight {
		border-left: 2px solid var(--color-accent);
	}

	.log.highlight p:not(.stamp) {
		color: color-mix(in srgb, var(--color-accent) 70%, var(--color-main));
	}

	.stamp {
		color: var(--color-accent);
	}

	.warning {
		color: var(--color-warning);
		letter-spacing: 0.06em;
	}

	.noise {
		font-family: var(--font-mono);
		color: color-mix(in srgb, var(--color-main) 45%, transparent);
		white-space: pre;
		overflow: hidden;
		margin: 0.75rem 0;
		animation: flicker 3s infinite steps(1);
	}

	@keyframes flicker {
		0%,
		92% {
			opacity: 1;
		}
		94% {
			opacity: 0.4;
		}
		96% {
			opacity: 0.9;
		}
	}

	footer {
		margin-top: 1.5rem;
	}

	@media (max-width: 760px) {
		.archive {
			grid-template-columns: 1fr;
			grid-template-rows: auto 1fr;
		}
		.tree {
			border-right: none;
			border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
			max-height: 35vh;
		}
	}
</style>
