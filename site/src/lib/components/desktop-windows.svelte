<script lang="ts">
	import { WINDOW_MANAGER } from '$lib/managers/window-manager.svelte';
	import Window from '$lib/components/window.svelte';
	import WindowContent from '$lib/components/window-content.svelte';
	import DirWindow from '$lib/components/dir-window.svelte';
	import CharacterOverviewWindow from '$lib/components/character-overview-window.svelte';

	let windows = $derived(WINDOW_MANAGER.windows);
</script>

<main>
	{#each windows as window, index (window.id)}
		{#if window.state === 'open'}
			<Window bind:context={windows[index]}>
				{#snippet content()}
					{#if window.type === 'dir'}
						<DirWindow window={windows[index]} />
					{:else if window.type === 'characterOverview'}
						<CharacterOverviewWindow window={windows[index]} />
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
