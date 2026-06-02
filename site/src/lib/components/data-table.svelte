<script lang="ts">
	import type { Snippet } from 'svelte';

	type Column = { label: string; key: string };

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

	let filteredItems = $derived(
		items.filter((item) =>
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

<div class="table-wrapper">
	<table>
		<thead>
			<tr>
				{#each columns as col, i}
					<th>
						<span class="col-label">{col.label}</span>
						<input
							class="col-filter"
							type="text"
							placeholder="filter…"
							bind:value={filters[i]}
							aria-label="Filter by {col.label}"
						/>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each filteredItems as item}
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
		padding: 8px 8px 4px;
		text-align: left;
		vertical-align: top;
		white-space: nowrap;
	}

	.col-label {
		display: block;
		font-weight: bold;
		color: var(--color-accent);
		letter-spacing: 0.05em;
		margin-bottom: 4px;
	}

	.col-filter {
		display: block;
		width: 100%;
		min-width: 80px;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--border-color-dim);
		color: var(--color-main);
		font-family: var(--font-mono);
		font-size: 0.75em;
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

	:global(.table-wrapper tbody tr) {
		border-bottom: 1px solid var(--border-color-dim);
	}

	:global(.table-wrapper tbody td) {
		padding: 12px 8px;
		vertical-align: middle;
	}
</style>
