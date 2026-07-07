<script lang="ts">
	import { type CodexWindow } from '$lib/managers/window-manager.svelte';

	let { window }: { window: CodexWindow } = $props();

	const src = $derived(`/api/drive/${window.contentData}`);
</script>

<audio controls {src}></audio>

<style>
	audio {
		width: 100%;
	}
</style>
