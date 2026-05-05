<script lang="ts">
	import Window from '$lib/codex/components/window.svelte';
	import { type CodexWindow } from '$lib/codex/services/window-service.svelte';

	let { window }: { window: CodexWindow } = $props();

	const imageUrl = `/api/drive/${window.contentData}`;
</script>

{#snippet image()}
	<img src={imageUrl} alt={window.title} />
{/snippet}

<Window bind:context={window} content={image} />

<style>
	img {
		width: 100%;
		height: calc(100% - 10px);
		object-fit: contain;
	}
</style>
