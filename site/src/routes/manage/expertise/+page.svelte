<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { CirclePlus } from '@lucide/svelte';
	import { type PageProps } from './$types';
	import DataTable from '$lib/components/data-table.svelte';
	import type { Expertise } from '$lib/db/expertise.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();

	let expertise = $derived<Expertise[]>(data.expertise);

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Group', key: 'groupName' },
		{ label: 'Name', key: 'name' },
		{ label: 'Description', key: 'description' },
		{ label: 'Cost', key: 'cost' }
	];

	async function saveCosts() {
		try {
			const result = await fetch('/api/expertise/bulk', {
				method: 'post',
				body: JSON.stringify($state.snapshot(expertise)),
				headers: { 'content-type': 'application/json' }
			});
			if (result.ok) {
				TOAST_MANAGER.success('Costs updated');
				await invalidate('/api/expertise');
			} else {
				TOAST_MANAGER.error('Failed to update costs');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}
</script>

<main>
	<div class="actions">
		<a href={resolve('/manage/expertise/new')}><CirclePlus /></a>
		<button class="btn" onclick={saveCosts}>save costs</button>
	</div>
	<DataTable items={expertise} {columns}>
		{#snippet row(item)}
			{@const entry = item as (typeof expertise)[0]}
			<tr>
				<td><a href={resolve('/manage/expertise/[id]', { id: String(entry.id) })}>{entry.id}</a></td>
				<td>{entry.groupName}</td>
				<td>{entry.name}</td>
				<td>{entry.description}</td>
				<td><input type="number" min="0" bind:value={entry.cost} /></td>
			</tr>
		{/snippet}
	</DataTable>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		justify-content: end;
		align-items: end;
		gap: 8px;
		padding: 16px;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	input[type='number'] {
		width: 90px;
	}
</style>
