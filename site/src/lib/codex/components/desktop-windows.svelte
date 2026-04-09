<script lang="ts">
	import { WINDOW_SERVICE } from '$lib/codex/services/window-service.svelte';
	import Window from '$lib/codex/components/window.svelte';

	const windows = $derived(WINDOW_SERVICE.openWindows);
</script>

<main>
	{#each windows, index}
		<Window bind:context={windows[index]} />
	{/each}
</main>

<style>
	main {
		position: absolute;
		width: 100%;
		height: 100%;
	}
</style>
