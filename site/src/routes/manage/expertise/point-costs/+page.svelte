<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { type PageProps } from './$types';
	import type { ExpertisePointCost } from '$lib/db/expertise_point_costs.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();

	let pointCosts = $derived<ExpertisePointCost[]>(
		[...data.pointCosts].sort((a, b) => a.point - b.point)
	);

	function addRow() {
		pointCosts = [...pointCosts, { point: 0, cost: 0 }];
	}

	function removeRow(index: number) {
		pointCosts = pointCosts.filter((_, i) => i !== index);
	}

	async function save() {
		try {
			const result = await fetch('/api/expertise/point-costs', {
				method: 'put',
				body: JSON.stringify($state.snapshot(pointCosts)),
				headers: { 'content-type': 'application/json' }
			});
			if (result.ok) {
				TOAST_MANAGER.success('Point costs updated');
				await invalidate('/api/expertise/point-costs');
			} else {
				TOAST_MANAGER.error('Failed to update point costs');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}
</script>

<main>
	<a href={resolve('/manage/expertise')}>back</a>
	<h1>expertise point costs</h1>
	<p class="hint">
		Every expertise shares this cost curve, from 0 to 100. Each row is a breakpoint — an amount of
		expertise and the total cost to reach it. The cost of amounts between breakpoints is linearly
		interpolated (an implicit 0 -&gt; 0 breakpoint is always assumed below the lowest row).
	</p>
	<table>
		<thead>
			<tr>
				<th>amount of expertise</th>
				<th>total value</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each pointCosts as entry, i (i)}
				<tr>
					<td><input type="number" min="0" max="100" bind:value={entry.point} /></td>
					<td><input type="number" min="0" bind:value={entry.cost} /></td>
					<td><button class="btn" onclick={() => removeRow(i)}>remove</button></td>
				</tr>
			{/each}
		</tbody>
	</table>
	<div class="actions">
		<button class="btn" onclick={addRow}>+ add row</button>
		<button class="btn" onclick={save}>save</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px;
	}

	.hint {
		opacity: 0.6;
		font-size: 0.9em;
		max-width: 60ch;
	}

	table {
		border-collapse: collapse;
	}

	th,
	td {
		text-align: left;
		padding: 4px 12px 4px 0;
	}

	input[type='number'] {
		width: 90px;
	}

	.actions {
		display: flex;
		gap: 8px;
	}
</style>
