<script lang="ts">
	import Window from '$lib/codex/components/window.svelte';
	import CodexWindow from '$lib/codex/services/winodw-service.svelte';
	import pdfContent from '$lib/assets/documents/irene.pdf';

	let { window }: { window: CodexWindow } = $props();
</script>

{#snippet pdf()}
	<embed src={pdfContent} />
{/snippet}
<Window bind:context={window} content={pdf} />

<style></style>
