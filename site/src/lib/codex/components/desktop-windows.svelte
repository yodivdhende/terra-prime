<script lang="ts">
	import { WINDOW_SERVICE } from '$lib/codex/services/window-service.svelte';
	import Window from '$lib/codex/components/window.svelte';

	const windows = WINDOW_SERVICE.openWindows;
</script>

<main>
	{#each windows as window (window.id)}
		<Window bind:context={window} />
	{/each}
</main>

<style>
	main {
		position: absolute;
		width: 100%;
		height: 100%;
	}
</style>
