<script lang="ts">
	import { CirclePlus } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import DataTable from '$lib/components/data-table.svelte';

	let { data }: PageProps = $props();

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Name', key: 'name' },
		{ label: 'Description', key: 'description' }
	];
</script>

<main>
	<a href={resolve('/manage/companies/new')}><CirclePlus /></a>
	<DataTable items={data.companies} {columns}>
		{#snippet row(item)}
			{@const company = item as typeof data.companies[0]}
			<tr>
				<td><a href={resolve('/manage/companies/[id]', { id: String(company.id) })}>{company.id}</a></td>
				<td>{company.name}</td>
				<td>{company.description}</td>
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
