<script lang="ts">
	import Window from '$lib/codex/components/window.svelte';
	import { type CodexWindow } from '$lib/codex/services/window-service.svelte';
	import pdfContent from '$lib/assets/documents/irene.pdf?url';

	let { window }: { window: CodexWindow } = $props();
</script>

{#snippet pdf()}
	<embed src="{pdfContent}#toolbar=0&navpanes=0&scrollbar=0" />
{/snippet}

<Window bind:context={window} content={pdf} />

<style>
	embed {
		width: 100%;
		height: calc(100% - 10px);
		overflow: hidden;
	}
</style>
