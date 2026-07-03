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
	<a href="implants/new"><CirclePlus /></a>
	<DataTable items={data.implants} {columns}>
		{#snippet row(item)}
			{@const implant = item as typeof data.implants[0]}
			<tr>
				<td><a href="implants/{implant.id}">{implant.id}</a></td>
				<td>{implant.name}</td>
				<td>{implant.description}</td>
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
