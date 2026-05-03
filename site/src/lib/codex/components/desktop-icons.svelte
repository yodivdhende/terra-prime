<script lang="ts">
	import { ICON_SERVICE, type Icon } from '$lib/codex/services/icon-service.svelte';
	import { WINDOW_SERVICE } from '$lib/codex/services/window-service.svelte';
	import { File, Folder } from '@lucide/svelte';

	let icons = $derived(ICON_SERVICE.icons);

	$inspect(icons);

	function openWindow(icon: Icon) {
		const { windowId } = $state.snapshot(icon);
		icon.windowId = WINDOW_SERVICE.openWindow({ id: windowId });
	}
</script>

<main>
	{#each icons as icon (icon.windowId)}
		{#if icon.type === 'file'}
			<button onclick={() => openWindow(icon)}>
				<div class="icon">
					<File size={64} strokeWidth={1} />
				</div>
				{icon.title}
			</button>
		{/if}
		{#if icon.type === 'dir'}
			<button onclick={() => openWindow(icon)}>
				<div class="icon">
					<Folder size={64} strokeWidth={1} />
				</div>
				{icon.title}
			</button>
		{/if}
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
		width: 100px;
		color: var(--color-text-dim);
		outline: none;
		border: 1px solid transparent;
		cursor: pointer;
		padding: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.05em;
		transition:
			color 0.1s,
			border-color 0.1s,
			text-shadow 0.1s,
			filter 0.1s;
		background-color: black;
	}

	.icon {
		background-color: var(--color-bg);
		z-index: 1;
	}

	button:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
		text-shadow: var(--phosphor-glow-color);
		filter: drop-shadow(0 0 6px var(--phosphor-glow-color));
	}

	button:hover .icon {
		border-color: var(--color-accent);
	}

	button:active {
		background-color: var(--color-accent);
		color: var(--color-bg);
	}

	button:active .icon {
		background-color: var(--color-accent);
	}
</style>
