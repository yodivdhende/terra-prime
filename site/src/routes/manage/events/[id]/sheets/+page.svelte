<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import CharacterSheet from '$lib/components/character-sheet.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const sheets = $derived(data.sheets ?? []);
	const eventId = $derived(data.event?.id != null ? String(data.event.id) : null);

	// Open the print dialog straight away — this page exists to be printed.
	onMount(() => {
		if (sheets.length > 0) window.print();
	});
</script>

<main>
	<div class="toolbar no-print">
		{#if eventId != null}
			<a href={resolve('/manage/events/[id]', { id: eventId })}>back</a>
		{/if}
		<button class="btn" onclick={() => window.print()}>print</button>
	</div>

	{#if sheets.length === 0}
		<p class="status no-print">No sheets to print for this event.</p>
	{:else}
		{#each sheets as { characterVersionId, characterName, ownerName, version } (characterVersionId)}
			<div class="sheet">
				{#if version != null}
					<CharacterSheet
						{characterName}
						versionName={version.name}
						companyName={version.company?.name ?? null}
						{ownerName}
						eventName={data.event?.name ?? null}
						expertise={version.expertise}
						implants={version.implants}
						items={version.items}
					/>
				{:else}
					<p class="status">version not found for {characterName}</p>
				{/if}
			</div>
		{/each}
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 8px;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.sheet {
		background: white;
	}

	.status {
		font-size: 0.8rem;
		opacity: 0.5;
	}

	@page {
		size: A4;
		margin: 12mm;
	}

	@media print {
		.no-print {
			display: none !important;
		}

		main {
			gap: 0;
			padding: 0;
		}

		/* One participant per page, without a trailing blank sheet. */
		.sheet {
			break-after: page;
		}

		.sheet:last-child {
			break-after: auto;
		}
	}
</style>
