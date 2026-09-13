<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { CirclePlus, Wifi, WifiOff } from '@lucide/svelte';
	import DataTable from '$lib/components/data-table.svelte';
	import type { Device } from '$lib/types/device';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';
	import { REALTIME_MANAGER } from '$lib/managers/realtime-manager.svelte';
	import { isWebSerialSupported, programUid } from '$lib/utils/web-serial';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/**
	 * `roles` is flattened to a string so the table's per-column filter can search it — a device's
	 * roles are now the only thing that says what the device is. `liveLabel` is there for the same
	 * reason: the table filters on `String(item[key])`, so the column it filters has to be text.
	 *
	 * `live` comes from the realtime feed rather than the registry: whether a prop is answering is
	 * not something the database knows, and the retained status topic is the authority on it.
	 */
	let devices = $derived(
		data.devices.map((device: Device) => {
			const live = REALTIME_MANAGER.device(device.uid);
			return {
				...device,
				roleNames: device.roles.map(({ role }) => role).join(', '),
				live,
				liveLabel: live == null ? 'never seen' : live.online ? 'online' : 'offline'
			};
		})
	);

	let programmingId: number | null = $state(null);
	const webSerial = isWebSerialSupported();

	onMount(() => REALTIME_MANAGER.connect());

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Name', key: 'name' },
		{ label: 'Uid', key: 'uid' },
		{ label: 'Roles', key: 'roleNames' },
		{ label: 'Live', key: 'liveLabel' },
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

	async function showScreen(uid: string, screen: string) {
		const result = await REALTIME_MANAGER.sendDeviceCommand(uid, { kind: 'cyd.show', screen });
		if (result.ok) TOAST_MANAGER.success(`sent ${screen}`);
		else TOAST_MANAGER.error(result.error);
	}
</script>

<main>
	<div class="actions">
		<span class="broker" class:online={REALTIME_MANAGER.brokerConnected}>
			{#if REALTIME_MANAGER.brokerConnected}
				<Wifi size="16" /> broker connected
			{:else}
				<WifiOff size="16" /> broker unreachable
			{/if}
		</span>
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
					{#if device.live == null}
						<span class="unseen">never seen</span>
					{:else if device.live.online}
						online{device.live.battery == null ? '' : ` · ${device.live.battery}%`}{device.live
							.wifiStrength == null
							? ''
							: ` · ${device.live.wifiStrength}/4`}
					{:else}
						offline
					{/if}
				</td>
				<td class="row-actions">
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
					<button
						class="btn"
						type="button"
						disabled={REALTIME_MANAGER.brokerConnected === false}
						onclick={() => showScreen(device.uid, 'virus')}
					>
						send virus
					</button>
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

	.broker {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.85em;
		opacity: 0.7;
	}

	.broker.online {
		opacity: 1;
		color: var(--color-accent);
	}

	.unseen {
		opacity: 0.5;
	}

	.row-actions {
		display: flex;
		gap: 8px;
	}
</style>
