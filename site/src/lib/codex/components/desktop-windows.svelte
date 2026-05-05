<script lang="ts">
	import { WINDOW_SERVICE } from '$lib/codex/services/window-service.svelte';
	import Window from '$lib/codex/components/window.svelte';
	import WindowContent from '$lib/codex/components/window-content.svelte';
	import DirWindow from '$lib/codex/components/dir-window.svelte';

	let windows = $derived(WINDOW_SERVICE.windows);
</script>

<main>
	{#each windows as window, index (window.id)}
		{#if window.state === 'open'}
			<Window bind:context={windows[index]}>
				{#snippet content()}
					{#if window.type === 'dir'}
						<DirWindow window={windows[index]} />
					{:else}
						<WindowContent window={windows[index]} />
					{/if}
				{/snippet}
			</Window>
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
