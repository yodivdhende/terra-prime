<script lang="ts">
	import { WINDOW_MANAGER } from '$lib/codex/managers/window-manager.svelte';
	import Window from '$lib/codex/components/window.svelte';
	import WindowContent from '$lib/codex/components/window-content.svelte';
	import DirWindow from '$lib/codex/components/dir-window.svelte';

	let windows = $derived(WINDOW_MANAGER.windows);
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
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 10;
		pointer-events: none;
		font-size: 1rem;
	}
</style>
