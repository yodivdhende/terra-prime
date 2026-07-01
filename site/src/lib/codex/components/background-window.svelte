<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';
	import { type CodexWindow } from '$lib/codex/managers/window-manager.svelte';
	import WindowContent from '$lib/codex/components/window-content.svelte';

	let { window }: { window: CodexWindow } = $props();

	type DirEntry = { id: string; name: string; mimeType: string };

	let entries = $state<DirEntry[]>([]);
	let loading = $state(true);
	let failed = $state(false);
	let expanded = $state<Record<string, DirEntry[] | 'loading'>>({});
	let selected = $state<DirEntry | null>(null);

	let previewWindow = $derived.by(() => {
		if (selected == null) return null;
		const result: CodexWindow = {
			...window,
			contentData: selected.id,
			title: selected.name,
			type: entryType(selected.mimeType)
		};
		return result;
	});

	let previewable = $derived(
		selected != null &&
			(selected.mimeType.includes('image') ||
				selected.mimeType.includes('pdf') ||
				selected.mimeType.includes('document'))
	);

	function googleUrl(entry: DirEntry): string {
		const { id, mimeType } = entry;
		if (mimeType.includes('spreadsheet'))
			return `https://docs.google.com/spreadsheets/d/${id}/edit`;
		if (mimeType.includes('presentation'))
			return `https://docs.google.com/presentation/d/${id}/edit`;
		if (mimeType.includes('document')) return `https://docs.google.com/document/d/${id}/edit`;
		return `https://drive.google.com/file/d/${id}/view`;
	}

	let driveUrl = $derived(selected != null ? googleUrl(selected) : null);

	$effect(() => {
		loading = true;
		failed = false;
		fetch('/api/my/backgrounds')
			.then((r) => {
				if (!r.ok) throw new Error();
				return r.json();
			})
			.then((data: DirEntry[]) => {
				entries = data;
				loading = false;
			})
			.catch(() => {
				failed = true;
				loading = false;
			});
	});

	function toggleFolder(entry: DirEntry) {
		if (expanded[entry.id] != null) {
			const { [entry.id]: _, ...rest } = expanded;
			expanded = rest;
			return;
		}
		expanded = { ...expanded, [entry.id]: 'loading' };
		fetch(`/api/drive/${entry.id}/dir`)
			.then((r) => {
				if (!r.ok) throw new Error();
				return r.json();
			})
			.then((data: DirEntry[]) => {
				expanded = { ...expanded, [entry.id]: data };
			})
			.catch(() => {
				const { [entry.id]: _, ...rest } = expanded;
				expanded = rest;
			});
	}

	function isFolder(entry: DirEntry) {
		return entry.mimeType.includes('folder');
	}

	function entryType(mimeType: string): CodexWindow['type'] {
		if (mimeType.includes('image')) return 'image';
		if (mimeType.includes('pdf')) return 'pdf';
		return 'doc';
	}
</script>

<div class="dir-window">
	<div class="tree">
		{#if loading}
			<span class="status">loading...</span>
		{:else if failed}
			<span class="status error">failed to load</span>
		{:else if entries.length === 0}
			<span class="status">no backgrounds found</span>
		{:else}
			{#each entries as entry}
				{@render treeEntry(entry, 0)}
			{/each}
		{/if}
	</div>

	<div class="preview">
		{#if selected != null}
			<div class="preview-header">
				<span class="preview-name">{selected.name}</span>
				<a
					href={driveUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="open-link"
					title="Open in Google Drive"
				>
					<ExternalLink size={24} />
				</a>
			</div>
		{/if}
		<div class="preview-content">
			{#if selected == null}
				<span class="status">select a file to preview</span>
			{:else if !previewable}
				<span class="status">no preview available</span>
			{:else if previewWindow}
				<WindowContent window={previewWindow} />
			{/if}
		</div>
	</div>
</div>

{#snippet treeEntry(entry: DirEntry, depth: number)}
	{#if isFolder(entry)}
		<button
			class="entry folder"
			class:expanded={expanded[entry.id] != null}
			style:padding-left="{0.75 + depth * 1}rem"
			onclick={() => toggleFolder(entry)}
		>
			{#if expanded[entry.id] != null}
				<span class="arrow">v</span>
			{:else}
				<span class="arrow">></span>
			{/if}
			<span class="name">{entry.name}</span>
		</button>
		{@const children = expanded[entry.id]}
		{#if children === 'loading'}
			<span class="status" style:padding-left="{0.75 + (depth + 1) * 1}rem">loading...</span>
		{:else if Array.isArray(children)}
			{#each children as child}
				{@render treeEntry(child, depth + 1)}
			{/each}
		{/if}
	{:else}
		<button
			class="entry file"
			class:active={selected?.id === entry.id}
			style:padding-left="{0.75 + depth * 1}rem"
			onclick={() => (selected = entry)}
		>
			<span class="name">{entry.name}</span>
		</button>
	{/if}
{/snippet}

<style>
	.dir-window {
		display: grid;
		grid-template-columns: 1fr 2fr;
		height: 100%;
		overflow: hidden;
		font-size: 1rem;
	}

	.tree {
		border-right: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		overflow-y: auto;
		padding: 0.5rem 0;
		display: flex;
		flex-direction: column;
	}

	.preview {
		overflow: hidden;
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}

	.preview-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.75rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
		flex-shrink: 0;
		font-size: 1.2em;
	}

	.preview-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.7em;
		opacity: 0.6;
		letter-spacing: 0.05em;
	}

	.open-link {
		color: var(--color-main);
		opacity: 0.45;
		display: flex;
		align-items: center;
		flex-shrink: 0;
		transition: opacity 0.1s;
	}

	.open-link:hover {
		opacity: 1;
		color: var(--color-accent);
	}

	.entry {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding-top: 0.25rem;
		padding-right: 0.75rem;
		padding-bottom: 0.25rem;
		background: none;
		border: none;
		color: var(--color-main);
		font-family: inherit;
		font-size: 0.75em;
		text-align: left;
		cursor: pointer;
		width: 100%;
		letter-spacing: 0.03em;
		opacity: 0.75;
		transition: opacity 0.1s;
	}

	.entry:hover {
		opacity: 1;
	}

	.entry.active {
		opacity: 1;
		color: var(--color-accent);
	}

	.arrow {
		font-size: 0.65em;
		flex-shrink: 0;
		opacity: 0.6;
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.status {
		display: block;
		padding: 0.5rem 0.75rem;
		opacity: 0.4;
		font-size: 0.7em;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.status.error {
		color: var(--color-accent);
		opacity: 1;
	}

	.preview-content .status {
		padding: 0.75rem;
		align-self: flex-start;
	}

	.preview-content :global(img),
	.preview-content :global(embed) {
		width: 100%;
		height: 100%;
	}

	.preview-content :global(.doc-content) {
		height: 100%;
	}

	.preview-content {
		flex: 1;
		min-height: 0;
		overflow: hidden;
		position: relative;
	}
</style>
