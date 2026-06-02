<script lang="ts">
	import { CirclePlus } from '@lucide/svelte';
	import { type PageProps } from './$types';
	import DataTable from '$lib/components/data-table.svelte';

	let { data }: PageProps = $props();

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Group', key: 'groupName' },
		{ label: 'Name', key: 'name' },
		{ label: 'Description', key: 'description' }
	];
</script>

<main>
	<a href="skills/new"><CirclePlus /></a>
	<DataTable items={data.skills} {columns}>
		{#snippet row(item)}
			{@const skill = item as typeof data.skills[0]}
			<tr>
				<td><a href="skills/{skill.id}">{skill.id}</a></td>
				<td>{skill.groupName}</td>
				<td>{skill.name}</td>
				<td>{skill.description}</td>
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
