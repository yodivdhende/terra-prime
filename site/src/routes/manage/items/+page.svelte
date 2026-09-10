<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { CirclePlus } from '@lucide/svelte';
	import { type PageProps } from './$types';
	import DataTable from '$lib/components/data-table.svelte';
	import type { Item } from '$lib/db/items.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();

	let items = $derived<Item[]>(data.items);

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Name', key: 'name' },
		{ label: 'Description', key: 'description' },
		{ label: 'Cost', key: 'cost' }
	];

	async function saveCosts() {
		try {
			const result = await fetch('/api/items/bulk', {
				method: 'post',
				body: JSON.stringify($state.snapshot(items)),
				headers: { 'content-type': 'application/json' }
			});
			if (result.ok) {
				TOAST_MANAGER.success('Costs updated');
				await invalidate('/api/items');
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
		<a href={resolve('/manage/items/new')}><CirclePlus /></a>
		<button class="btn" onclick={saveCosts}>save costs</button>
	</div>
	<DataTable items={items} {columns}>
		{#snippet row(item)}
			{@const it = item as (typeof items)[0]}
			<tr>
				<td><a href={resolve('/manage/items/[id]', { id: String(it.id) })}>{it.id}</a></td>
				<td>{it.name}</td>
				<td>{it.description}</td>
				<td><input type="number" min="0" bind:value={it.cost} /></td>
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
