<script lang="ts">
	import { type CodexWindow } from '$lib/codex/services/window-service.svelte';
	import PdfWindow from '$lib/codex/components/pdf-window.svelte';
	import DocWindow from '$lib/codex/components/doc-window.svelte';
	import ImageWindow from '$lib/codex/components/image-window.svelte';

	let { window }: { window: CodexWindow } = $props();
</script>

{#if window.type === 'pdf'}
	<PdfWindow {window} />
{:else if window.type === 'doc'}
	<DocWindow {window} />
{:else if window.type === 'image'}
	<ImageWindow {window} />
{/if}
