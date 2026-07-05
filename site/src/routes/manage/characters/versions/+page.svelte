<script lang="ts">
	import { type PageProps } from './$types';
	import ConfirmModal from '$lib/components/confirm-modal.svelte';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();

	let versions: { id: number; name: string; characterId: number; characterName: string }[] = $state(
		[]
	);
	$effect(() => {
		versions = data.versions;
	});

	let modal: ConfirmModal;
	let pendingDeleteId: number | null = $state(null);

	function requestDelete(id: number) {
		pendingDeleteId = id;
		modal.open();
	}

	async function deleteVersion() {
		const id = pendingDeleteId;
		if (id == null) return;
		try {
			const result = await fetch(`/api/characters/versions/${id}`, { method: 'delete' });
			if (result.ok) {
				versions = versions.filter((version) => version.id !== id);
				TOAST_MANAGER.success('Version deleted');
			} else {
				TOAST_MANAGER.error(`Delete failed (${result.status})`);
			}
		} catch (err: any) {
			TOAST_MANAGER.error(err?.message ?? 'Something went wrong');
		}
	}
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
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each versions as version}
				<tr>
					<td>{version.id}</td>
					<td>{version.characterName}</td>
					<td>{version.name}</td>
					<td><a href="/manage/versions/{version.id}">edit</a></td>
					<td
						><button class="btn btn-danger" onclick={() => requestDelete(version.id)}>delete</button
						></td
					>
				</tr>
			{/each}
			{#if versions.length === 0}
				<tr>
					<td colspan="5" class="empty">no versions</td>
				</tr>
			{/if}
		</tbody>
	</table>

	<ConfirmModal
		bind:this={modal}
		message="Delete this character version?"
		onconfirm={deleteVersion}
		oncancel={() => modal.close()}
	/>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
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
