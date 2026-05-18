<script lang="ts">
	import { type PageProps } from './$types';

	let { data }: PageProps = $props();

	const versions = $derived(
		data.versions as { id: number; name: string; characterId: number; characterName: string }[]
	);
</script>

<main>
	<a href="..">back</a>

	<table>
		<thead>
			<tr>
				<th>Id</th>
				<th>Character</th>
				<th>Name</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each versions as version}
				<tr>
					<td>{version.id}</td>
					<td>{version.characterName}</td>
					<td>{version.name}</td>
					<td><a href="/manage/characters/{version.characterId}/versions/{version.id}">edit</a></td>
				</tr>
			{/each}
			{#if versions.length === 0}
				<tr>
					<td colspan="4" class="empty">no versions</td>
				</tr>
			{/if}
		</tbody>
	</table>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
		background-color: white;
	}

	table {
		margin-top: 8px;
		border-collapse: collapse;
		width: 100%;
	}

	th {
		text-align: left;
		padding: 8px;
		font-size: 0.8rem;
		opacity: 0.6;
	}

	tr {
		border-bottom: 1px solid silver;
	}

	td {
		padding: 8px;
	}

	.empty {
		font-size: 0.8rem;
		opacity: 0.5;
		font-style: italic;
	}
</style>
