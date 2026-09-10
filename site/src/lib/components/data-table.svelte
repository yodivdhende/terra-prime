<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Filter } from '@lucide/svelte';

	type Column = { label: string; key: string };

	function focusOnMount(node: HTMLElement) {
		node.focus();
	}

	let {
		items,
		columns,
		row
	}: {
		items: Record<string, unknown>[];
		columns: Column[];
		row: Snippet<[Record<string, unknown>]>;
	} = $props();

	let filters: string[] = $state([]);
	let openIndex: number | null = $state(null);

	let filteredItems = $derived(
		(Array.isArray(items) ? items : []).filter((item) =>
			columns.every((col, i) => {
				const f = filters[i] ?? '';
				if (!f) return true;
				return String(item[col.key] ?? '')
					.toLowerCase()
					.includes(f.toLowerCase());
			})
		)
	);
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') openIndex = null; }} />

{#if openIndex !== null}
	<div class="filter-backdrop" role="presentation" onclick={() => (openIndex = null)}></div>
{/if}

<div class="table-wrapper">
	<table>
		<thead>
			<tr>
				{#each columns as col, i (col.key)}
					<th>
						<div class="col-header">
							<span class="col-label">{col.label}</span>
							<button
								class="filter-btn"
								class:active={filters[i]}
								onclick={() => (openIndex = openIndex === i ? null : i)}
								aria-label="Filter by {col.label}"
								aria-expanded={openIndex === i}
							>
								<Filter size={12} />
							</button>
						</div>
						{#if openIndex === i}
							<div class="filter-dropdown">
								<input
									class="col-filter"
									type="text"
									placeholder="Filter…"
									bind:value={filters[i]}
									aria-label="Filter by {col.label}"
									use:focusOnMount
								/>
								{#if filters[i]}
									<button class="clear-btn" onclick={() => (filters[i] = '')}>✕</button>
								{/if}
							</div>
						{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each filteredItems as item (item.id)}
				{@render row(item)}
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrapper {
		width: 100%;
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-mono);
		color: var(--color-main);
	}

	thead tr {
		border-bottom: var(--border-width) solid var(--color-accent);
	}

	th {
		padding: 8px 8px 8px;
		text-align: left;
		vertical-align: middle;
		white-space: nowrap;
		position: relative;
	}

	.col-header {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.col-label {
		font-weight: bold;
		color: var(--color-accent);
		letter-spacing: 0.05em;
	}

	.filter-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 3px;
		color: var(--color-main-dim);
		cursor: pointer;
		padding: 2px;
		line-height: 0;
		transition:
			color 0.15s,
			border-color 0.15s;
	}

	.filter-btn:hover,
	.filter-btn[aria-expanded='true'] {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.filter-btn.active {
		color: var(--color-accent);
	}

	.filter-backdrop {
		position: fixed;
		inset: 0;
		z-index: 10;
	}

	.filter-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 4px;
		background: var(--color-bg);
		border: 1px solid var(--color-accent);
		border-radius: 4px;
		padding: 6px 8px;
		min-width: 160px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	}

	.col-filter {
		flex: 1;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--border-color-dim);
		color: var(--color-main);
		font-family: var(--font-mono);
		font-size: 0.8em;
		padding: 2px 0;
		outline: none;
		transition: border-color 0.15s;
	}

	.col-filter:focus {
		border-bottom-color: var(--color-accent);
	}

	.col-filter::placeholder {
		color: var(--color-main-dim);
		font-style: italic;
	}

	.clear-btn {
		background: transparent;
		border: none;
		color: var(--color-main-dim);
		cursor: pointer;
		font-size: 0.75em;
		padding: 0 2px;
		line-height: 1;
	}

	.clear-btn:hover {
		color: var(--color-accent);
	}

	:global(.table-wrapper tbody tr) {
		border-bottom: 1px solid var(--border-color-dim);
	}

	:global(.table-wrapper tbody td) {
		padding: 12px 8px;
		vertical-align: middle;
	}
</style>
