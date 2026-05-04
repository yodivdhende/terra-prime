<script lang="ts">
	import Window from '$lib/codex/components/window.svelte';
	import { type CodexWindow } from '$lib/codex/services/window-service.svelte';

	let { window }: { window: CodexWindow } = $props();

	const pdfUrl = `/api/drive/${window.contentData}#toolbar=0&navpanes=0&scrollbar=0`;
</script>

{#snippet pdf()}
	<embed src={pdfUrl} />
{/snippet}

<Window bind:context={window} content={pdf} />

<style>
	embed {
		width: 100%;
		height: calc(100% - 10px);
		overflow: hidden;
	}
</style>
