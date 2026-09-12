<script lang="ts">
	import { resolve } from '$app/paths';
	import { CirclePlus } from '@lucide/svelte';
	import DataTable from '$lib/components/data-table.svelte';
	import type { Device } from '$lib/types/device';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';
	import { isWebSerialSupported, programUid } from '$lib/utils/web-serial';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/**
	 * `roles` is flattened to a string so the table's per-column filter can search it — a device's
	 * roles are now the only thing that says what the device is.
	 */
	let devices = $derived(
		data.devices.map((device: Device) => ({
			...device,
			roleNames: device.roles.map(({ role }) => role).join(', ')
		}))
	);

	let programmingId: number | null = $state(null);
	const webSerial = isWebSerialSupported();

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Name', key: 'name' },
		{ label: 'Uid', key: 'uid' },
		{ label: 'Roles', key: 'roleNames' },
		{ label: '', key: 'actions' }
	];

	async function program(device: { id: number; uid: string }) {
		programmingId = device.id;
		try {
			const result = await programUid(device.uid);
			if (result.ok) TOAST_MANAGER.success('Uid written to the board');
			else TOAST_MANAGER.error(result.error);
		} finally {
			programmingId = null;
		}
	}
</script>

<main>
	<div class="actions">
		<a href={resolve('/manage/devices/new')} aria-label="new device"><CirclePlus /></a>
	</div>
	<DataTable items={devices} {columns}>
		{#snippet row(item)}
			{@const device = item as (typeof devices)[0]}
			<tr>
				<td><a href={resolve('/manage/devices/[id]', { id: String(device.id) })}>{device.id}</a></td
				>
				<td>{device.name}</td>
				<td>{device.uid}</td>
				<td>{device.roleNames === '' ? 'unclassified' : device.roleNames}</td>
				<td>
					{#if webSerial}
						<button
							class="btn"
							type="button"
							disabled={programmingId === device.id}
							onclick={() => program(device)}
						>
							{programmingId === device.id ? 'programming…' : 'program via USB'}
						</button>
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

	.actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}
</style>
