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
	<a href="groups/new"><CirclePlus /></a>
	<DataTable items={data.groups} {columns}>
		{#snippet row(item)}
			{@const group = item as typeof data.groups[0]}
			<tr>
				<td><a href="groups/{group.id}">{group.id}</a></td>
				<td>{group.name}</td>
				<td>{group.description}</td>
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
