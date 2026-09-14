<script lang="ts">
	import { resolve } from '$app/paths';
	import { CirclePlus } from '@lucide/svelte';
	import DataTable from '$lib/components/data-table.svelte';
	import type { Mission } from '$lib/db/mission.repo';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let missions = $derived<Mission[]>(data.missions);

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Name', key: 'name' },
		{ label: 'Player limit', key: 'playerLimit' },
		{ label: 'Players', key: 'players' },
		{ label: 'Printers', key: 'printers' },
		{ label: 'Prints available', key: 'availablePrints' },
		{ label: 'Status', key: 'status' }
	];
</script>

<main>
	<div class="actions">
		<a href={resolve('/manage/missions/new')} aria-label="new mission"><CirclePlus /></a>
	</div>
	<DataTable items={missions} {columns}>
		{#snippet row(item)}
			{@const mission = item as (typeof missions)[0]}
			<tr>
				<td
					><a href={resolve('/manage/missions/[id]', { id: String(mission.id) })}>{mission.id}</a
					></td
				>
				<td>{mission.name}</td>
				<td>{mission.playerLimit === 0 ? '∞' : mission.playerLimit}</td>
				<td>{mission.participants.length}</td>
				<td>{mission.printers.length}</td>
				<td>{mission.availablePrints}</td>
				<td>{mission.status}</td>
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
