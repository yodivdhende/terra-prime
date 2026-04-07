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
		margin: 32px 32px;
		gap: 32px;
		grid-template-columns: repeat(3, min-content);
	}

	button {
		display: flex;
		flex-direction: column;
		justify-content: center;
		color: white;
		background: none;
		outline: none;
		border: none;
		cursor: pointer;
	}

	button:active {
		background-color: green;
		color: black;
	}
</style>
