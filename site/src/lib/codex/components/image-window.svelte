<script lang="ts">
	import { type CodexWindow } from '$lib/codex/services/window-manager.svelte';

	let { window }: { window: CodexWindow } = $props();

	const imageUrl = $derived(`/api/drive/${window.contentData}`);
</script>

<img src={imageUrl} alt={window.title} />

<style>
	img {
		width: 100%;
		height: calc(100% - 10px);
		object-fit: contain;
	}
</style>
