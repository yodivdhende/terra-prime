<script lang="ts">
	import { CirclePlus } from '@lucide/svelte';
	import { type PageProps } from './$types';
	import DataTable from '$lib/components/data-table.svelte';

	let { data }: PageProps = $props();

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Name', key: 'name' },
		{ label: 'Player', key: 'ownerName' },
		{ label: 'Backstory', key: 'backstoryId' }
	];
</script>

<main>
	<a href="characters/new"><CirclePlus /></a>
	<DataTable items={data.characters} {columns}>
		{#snippet row(item)}
			{@const character = item as typeof data.characters[0]}
			<tr>
				<td><a href="characters/{character.id}">{character.id}</a></td>
				<td>{character.name}</td>
				<td>{character.ownerName}</td>
				<td>
					{#if character.backstoryId}
						<a href={`https://docs.google.com/document/d/${character.backstoryId}/edit`} target="_blank" rel="noopener noreferrer">Open</a>
					{/if}
				</td>
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
