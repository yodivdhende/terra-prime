<script lang="ts">
	import { type CodexWindow } from '$lib/managers/window-manager.svelte';

	let { window }: { window: CodexWindow } = $props();

	const pdfUrl = $derived(`/api/drive/${window.contentData}#toolbar=0&navpanes=0&scrollbar=0`);
</script>

<embed src={pdfUrl} />

<style>
	embed {
		width: 100%;
		height: calc(100% - 10px);
		overflow: hidden;
	}
</style>
