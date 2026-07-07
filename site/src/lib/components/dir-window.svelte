<script lang="ts">
	import { type CodexWindow } from '$lib/managers/window-manager.svelte';
	import WindowContent from '$lib/components/window-content.svelte';

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

	$effect(() => {
		loading = true;
		failed = false;
		fetch(`/api/drive/${window.contentData}/dir`)
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
		{:else}
			{#each entries as entry}
				{@render treeEntry(entry, 0)}
			{/each}
		{/if}
	</div>

	<div class="preview">
		{#if selected == null}
			<span class="status">select a file to preview</span>
		{:else if !previewable}
			<span class="status">no preview available</span>
		{:else if previewWindow}
			<WindowContent window={previewWindow} />
		{/if}
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
		align-items: flex-start;
		justify-content: flex-start;
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

	.preview .status {
		padding: 0.75rem;
		align-self: flex-start;
	}

	.preview :global(img),
	.preview :global(embed) {
		width: 100%;
		height: 100%;
	}

	.preview :global(.doc-content) {
		height: 100%;
	}
</style>
