<script lang="ts">
	import { ICON_SERVICE, type Icon } from '$lib/codex/services/icon-service.svelte';
	import { WINDOW_SERVICE } from '$lib/codex/services/window-service.svelte';

	let icons = ICON_SERVICE.icons;

	function openWindow(icon: Icon) {
		WINDOW_SERVICE.openWindow({ content: icon.content });
	}
</script>

<main>
	{#each icons as icon (icon.id)}
		<button onclick={() => openWindow(icon)}>
			<svelte:component this={icon.icon} size={64} strokeWidth={1} />
			{icon.name}
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
		color: var(--accent);
		border-color: var(--accent);
		text-shadow: var(--phosphor-glow);
		filter: drop-shadow(0 0 6px #00ff41);
	}

	button:active {
		background-color: var(--accent);
		color: black;
	}
</style>
