<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { type PageProps } from './$types';
	import type { ExpertisePointCost } from '$lib/db/expertise_point_costs.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();

	let pointCosts = $derived<ExpertisePointCost[]>(data.pointCosts);

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
		Every expertise shares this cost curve — the cost of raising an expertise from one point to the
		next depends only on the point being bought, not on which expertise it is.
	</p>
	<table>
		<thead>
			<tr>
				<th>point</th>
				<th>cost</th>
			</tr>
		</thead>
		<tbody>
			{#each pointCosts as entry (entry.point)}
				<tr>
					<td>{entry.point}</td>
					<td><input type="number" min="0" bind:value={entry.cost} /></td>
				</tr>
			{/each}
		</tbody>
	</table>
	<div>
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
</style>
