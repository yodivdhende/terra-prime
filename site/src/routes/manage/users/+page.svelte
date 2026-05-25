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
				<th>Verified</th>
			</tr>
		</thead>
		<tbody>
			{#each data.users as user}
				<tr>
					<td><a href="./users/{user.id}">{user.id}</a></td>
					<td>{user.name}</td>
					<td>{user.email}</td>
					<td class="verified" class:no={!user.verified}>{user.verified ? 'yes' : 'no'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</main>

<style>
	main {
		padding: 16px;
	}
	tr {
		border-bottom: 1px solid silver;
	}
	td {
		padding: 16px 8px;
	}
	td.verified {
		color: green;
		font-weight: bold;
	}
	td.verified.no {
		color: tomato;
	}
</style>
