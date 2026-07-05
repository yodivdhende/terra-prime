<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { CirclePlus } from '@lucide/svelte';
	import { type PageProps } from './$types';
	import DataTable from '$lib/components/data-table.svelte';
	import type { Implant } from '$lib/db/implants.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();

	let implants = $state<Implant[]>([]);
	$effect(() => {
		implants = data.implants;
	});

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Name', key: 'name' },
		{ label: 'Description', key: 'description' },
		{ label: 'Cost', key: 'cost' }
	];

	async function saveCosts() {
		try {
			const result = await fetch('/api/implants/bulk', {
				method: 'post',
				body: JSON.stringify($state.snapshot(implants)),
				headers: { 'content-type': 'application/json' }
			});
			if (result.ok) {
				TOAST_MANAGER.success('Costs updated');
				await invalidate('/api/implants');
			} else {
				TOAST_MANAGER.error('Failed to update costs');
			}
		} catch (err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
	}
</script>

<main>
	<div class="actions">
		<a href="implants/new"><CirclePlus /></a>
		<button class="btn" onclick={saveCosts}>save costs</button>
	</div>
	<DataTable items={implants} {columns}>
		{#snippet row(item)}
			{@const implant = item as (typeof implants)[0]}
			<tr>
				<td><a href="implants/{implant.id}">{implant.id}</a></td>
				<td>{implant.name}</td>
				<td>{implant.description}</td>
				<td><input type="number" min="0" bind:value={implant.cost} /></td>
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
