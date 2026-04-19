<script lang="ts">
	import { ICON_SERVICE, type Icon } from '$lib/codex/services/icon-service.svelte';
	import { WINDOW_SERVICE } from '$lib/codex/services/window-service.svelte';

	let icons = $derived(ICON_SERVICE.icons);

	function openWindow(icon: Icon) {
		const { windowContent, windowId, title } = $state.snapshot(icon);
		icon.windowId = WINDOW_SERVICE.openWindow({
			content: windowContent,
			id: windowId,
			title: title
		});
	}
</script>

<main>
	{#each icons as icon (icon.id)}
		<button onclick={() => openWindow(icon)}>
			<icon.Icon size={64} strokeWidth={1} />
			{icon.name}.
		</button>
	{/each}
</main>

<style>
	main {
		display: grid;
		margin: 2rem;
		gap: 1.5rem;
		grid-template-columns: repeat(3, min-content);
		align-content: start;
	}

	button {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		color: var(--text-dim);
		background: none;
		outline: none;
		border: 1px solid transparent;
		cursor: pointer;
		padding: 0.5rem;
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.7rem;
		letter-spacing: 0.05em;
		transition:
			color 0.1s,
			border-color 0.1s,
			text-shadow 0.1s,
			filter 0.1s;
	}

	button:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
		text-shadow: var(--phosphor-glow-color);
		filter: drop-shadow(0 0 6px var(--phosphor-glow-color));
	}

	button:active {
		background-color: var(--color-accent);
		color: var(--color-bg);
	}
</style>
