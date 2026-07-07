<script lang="ts">
	import { type CodexWindow } from '$lib/managers/window-manager.svelte';

	let { window }: { window: CodexWindow } = $props();

	let html = $state('');
	let loading = $state(true);
	let failed = $state(false);

	$effect(() => {
		loading = true;
		failed = false;
		fetch(`/api/drive/${window.contentData}/doc`)
			.then((r) => {
				if (!r.ok) throw new Error();
				return r.text();
			})
			.then((text) => {
				html = text;
				loading = false;
			})
			.catch(() => {
				failed = true;
				loading = false;
			});
	});
</script>

<div class="doc-content">
	{#if loading}
		<span class="status">loading...</span>
	{:else if failed}
		<span class="status error">failed to load document</span>
	{:else}
		{@html html}
	{/if}
</div>

<style>
	.doc-content {
		padding: 1rem 1.25rem;
		overflow-y: hidden;
		color: var(--color-main) !important;
	}

	.status {
		display: block;
		opacity: 0.5;
		font-size: 0.75em;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.status.error {
		color: var(--color-accent);
	}

	.doc-content :global(h1),
	.doc-content :global(h2),
	.doc-content :global(h3) {
		color: var(--color-accent);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin: 1rem 0 0.4rem;
	}

	.doc-content :global(p) {
		margin: 0 0 0.6rem;
	}

	.doc-content :global(a) {
		color: var(--color-accent);
	}

	.doc-content :global(table) {
		border-collapse: collapse;
		width: 100%;
		margin-bottom: 0.75rem;
	}

	.doc-content :global(td),
	.doc-content :global(th) {
		border: 1px solid var(--color-accent);
		padding: 0.3rem 0.5rem;
	}
</style>
