<script lang="ts">
	import { type PageProps } from './$types';
	import DataTable from '$lib/components/data-table.svelte';

	let { data }: PageProps = $props();

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Name', key: 'name' },
		{ label: 'Email', key: 'email' },
		{ label: 'Verified', key: 'verified' }
	];
</script>

<main>
	<DataTable items={data.users} {columns}>
		{#snippet row(item)}
			{@const user = item as typeof data.users[0]}
			<tr>
				<td><a href="./users/{user.id}">{user.id}</a></td>
				<td>{user.name}</td>
				<td>{user.email}</td>
				<td class="verified" class:no={!user.verified}>{user.verified ? 'yes' : 'no'}</td>
			</tr>
		{/snippet}
	</DataTable>
</main>

<style>
	main {
		padding: 16px;
	}
	td.verified {
		color: green;
		font-weight: bold;
	}
	td.verified.no {
		color: tomato;
	}
</style>
