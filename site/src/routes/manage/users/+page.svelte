<script lang="ts">
	import { type PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<main>
	<table>
		<thead>
			<tr>
				<th>Id</th>
				<th>Name</th>
				<th>Email</th>
			</tr>
		</thead>
		<tbody>
			{#each data.users as user}
				<tr>
					<td><a href="./users/{user.id}">{user.id}</a></td>
					<td>{user.name}</td>
					<td>{user.email}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</main>

<style>
	main {
		padding: 16px;
		background-color: white;
	}
	tr {
		border-bottom: 1px solid silver;
	}
	td {
		padding: 16px 8px;
	}
</style>
