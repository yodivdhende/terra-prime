<script lang="ts">
	import { CirclePlus } from '@lucide/svelte';
	import { type PageProps } from './$types';
	import DataTable from '$lib/components/data-table.svelte';

	let { data }: PageProps = $props();

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Name', key: 'name' },
		{ label: 'Description', key: 'description' }
	];
</script>

<main>
	<a href="items/new"><CirclePlus /></a>
	<DataTable items={data.items} {columns}>
		{#snippet row(item)}
			{@const it = item as typeof data.items[0]}
			<tr>
				<td><a href="items/{it.id}">{it.id}</a></td>
				<td>{it.name}</td>
				<td>{it.description}</td>
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
</style>
