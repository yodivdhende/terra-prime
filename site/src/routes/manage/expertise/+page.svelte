<script lang="ts">
	import { resolve } from '$app/paths';
	import { CirclePlus, HardDriveDownload } from '@lucide/svelte';
	import { type PageProps } from './$types';
	import DataTable from '$lib/components/data-table.svelte';
	import type { Expertise, ExpertiseGroup } from '$lib/db/expertise.repo';
	import { buildIconPack, ICON_SIZE } from '$lib/utils/icon-export';
	import { rasterizeSvgAlpha } from '$lib/utils/rasterize-svg';

	let { data }: PageProps = $props();

	let expertise = $derived<Expertise[]>(data.expertise);
	let groups = $derived<ExpertiseGroup[]>(data.groups);

	let exporting = $state(false);
	let exportNote = $state('');

	/**
	 * Rasterizes every icon to a `{ICON_SIZE}px` LVGL `.bin` and downloads them as one archive,
	 * which unpacks onto an AguesGuard's SD card root. All of it happens in this tab: the server
	 * has no image library and does not need one for a once-in-a-while admin action.
	 */
	async function downloadIconPack() {
		exporting = true;
		exportNote = '';
		try {
			const withIds = (items: (Expertise | ExpertiseGroup)[]) =>
				items.flatMap((item) => (item.id == null ? [] : [{ id: item.id, icon: item.icon }]));
			const pack = await buildIconPack(
				{ expertise: withIds(expertise), groups: withIds(groups) },
				rasterizeSvgAlpha
			);
			const url = URL.createObjectURL(new Blob([pack.zip], { type: 'application/zip' }));
			const link = document.createElement('a');
			link.href = url;
			link.download = 'aguesguard-icons.zip';
			link.click();
			URL.revokeObjectURL(url);

			const missing = pack.skipped.expertise.length + pack.skipped.groups.length;
			exportNote =
				`${pack.files.length} icons at ${ICON_SIZE}px` +
				(missing > 0 ? ` - ${missing} entries have no icon set` : '');
		} catch (error) {
			exportNote = `export failed: ${error instanceof Error ? error.message : error}`;
		} finally {
			exporting = false;
		}
	}

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Group', key: 'groupName' },
		{ label: 'Name', key: 'name' },
		{ label: 'Description', key: 'description' }
	];
</script>

<main>
	<div class="actions">
		<a href={resolve('/manage/expertise/new')}><CirclePlus /></a>
		<a class="btn" href={resolve('/manage/expertise/point-costs')}>point costs</a>
		<button class="btn" onclick={downloadIconPack} disabled={exporting}>
			<HardDriveDownload size={16} />
			{exporting ? 'building...' : 'icon pack for AguesGuard'}
		</button>
	</div>
	{#if exportNote !== ''}
		<p class="note">{exportNote}</p>
	{/if}
	<DataTable items={expertise} {columns}>
		{#snippet row(item)}
			{@const entry = item as (typeof expertise)[0]}
			<tr>
				<td><a href={resolve('/manage/expertise/[id]', { id: String(entry.id) })}>{entry.id}</a></td
				>
				<td>{entry.groupName}</td>
				<td>{entry.name}</td>
				<td>{entry.description}</td>
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

	.actions button {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.note {
		margin: 0;
		font-size: 0.85rem;
		opacity: 0.8;
	}
</style>
