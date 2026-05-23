<script lang="ts">
	import { CirclePlus } from '@lucide/svelte';
	import { type PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<main>
	<a href="emails/new"><CirclePlus /></a>
	<table>
		<thead>
			<tr>
				<th>Id</th>
				<th>Key</th>
				<th>Doc URL</th>
			</tr>
		</thead>
		<tbody>
			{#each data.templates as template}
				<tr>
					<td><a href="emails/{template.id}">{template.id}</a></td>
					<td>{template.key}</td>
					<td class="url">
						<a href={template.docUrl} target="_blank" rel="noopener noreferrer">{template.docUrl}</a>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
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
	tr {
		border-bottom: 1px solid silver;
	}
	td {
		padding: 16px 8px;
	}
	td.url {
		max-width: 480px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
