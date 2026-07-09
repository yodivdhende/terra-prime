<script lang="ts">
	import { CirclePlus } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { type PageProps } from './$types';
	import DataTable from '$lib/components/data-table.svelte';

	let { data }: PageProps = $props();

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Key', key: 'key' },
		{ label: 'Doc URL', key: 'docUrl' }
	];
</script>

<main>
	<a href={resolve('/manage/emails/new')}><CirclePlus /></a>
	<DataTable items={data.templates} {columns}>
		{#snippet row(item)}
			{@const template = item as typeof data.templates[0]}
			<tr>
				<td><a href={resolve('/manage/emails/[id]', { id: String(template.id) })}>{template.id}</a></td>
				<td>{template.key}</td>
				<td class="url">
					<a href={template.docUrl} target="_blank" rel="noopener noreferrer external">{template.docUrl}</a>
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
	td.url {
		max-width: 480px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
