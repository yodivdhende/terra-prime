<script lang="ts">
	import { WINDOW_SERVICE } from '$lib/codex/services/window-service.svelte';
	import Window from '$lib/codex/components/window.svelte';
	import PdfWindow from '$lib/codex/components/pdf-window.svelte';

	let windows = $derived(WINDOW_SERVICE.windows);
</script>

alhost:5173/codex
<main>
	{#each windows as window, index (window.id)}
		{#if window.state === 'open'}
			{#if window.type === 'pdf'}
				<PdfWindow></PdfWindow>
			{:else}
				<Window bind:context={windows[index]} />
			{/if}
		{/if}
	{/each}
</main>

<style>
	main {
		position: absolute;
		width: 100%;
		height: 100%;
	}
</style>
