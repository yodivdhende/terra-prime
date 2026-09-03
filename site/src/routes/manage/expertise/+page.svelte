<script lang="ts">
	import { resolve } from '$app/paths';
	import { CirclePlus } from '@lucide/svelte';
	import { type PageProps } from './$types';
	import DataTable from '$lib/components/data-table.svelte';
	import type { Expertise } from '$lib/db/expertise.repo';

	let { data }: PageProps = $props();

	let expertise = $derived<Expertise[]>(data.expertise);

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Group', key: 'groupName' },
		{ label: 'Name', key: 'name' },
		{ label: 'Description', key: 'description' }
	];
</script>

<main>
	<div class="actions">
		<a href={resolve('/manage/expertise/new')}><CirclePlus /></a>
		<a class="btn" href={resolve('/manage/expertise/point-costs')}>point costs</a>
	</div>
	<DataTable items={expertise} {columns}>
		{#snippet row(item)}
			{@const entry = item as (typeof expertise)[0]}
			<tr>
				<td><a href={resolve('/manage/expertise/[id]', { id: String(entry.id) })}>{entry.id}</a></td
				>
				<td>{entry.groupName}</td>
				<td>{entry.name}</td>
				<td>{entry.description}</td>
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
</style>
