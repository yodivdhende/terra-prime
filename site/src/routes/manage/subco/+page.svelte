<script lang="ts">
	import { CirclePlus } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import DataTable from '$lib/components/data-table.svelte';

	let { data }: PageProps = $props();

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Name', key: 'name' },
		{ label: 'Company', key: 'company' },
		{ label: 'Members', key: 'members' }
	];
</script>

<main>
	<a href={resolve('/manage/subco/new')}><CirclePlus /></a>
	<DataTable items={data.subcos} {columns}>
		{#snippet row(item)}
			{@const subco = item as (typeof data.subcos)[0]}
			<tr>
				<td><a href={resolve('/manage/subco/[id]', { id: String(subco.id) })}>{subco.id}</a></td>
				<td>{subco.name}</td>
				<td>{subco.company}</td>
				<td>{subco.members.length}</td>
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
