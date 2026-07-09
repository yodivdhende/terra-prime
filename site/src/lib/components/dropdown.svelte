<script lang="ts">
	import type { Snippet } from 'svelte';

	let { button, content, open = false }: {
		button: Snippet;
		content: Snippet;
		open?: boolean;
	} = $props();
	let showContent = $derived(open);
</script>

<main class="dropdown">
	<button class="button" onclick={() => (showContent = !showContent)}>
		{@render button()}
	</button>
	{#if showContent}
		<div class="content">
			{@render content()}
		</div>
	{/if}
</main>

<style>
	.dropdown {
		height: 100%;
	}

	.button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.6rem;
		background: transparent;
		border: none;
		cursor: pointer;
		font-family: var(--font-mono);
		font-size: 0.95em;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-main);
		text-align: left;
	}

	.content {
		max-height: 100%;
		padding: 0.4rem 0.6rem 0.6rem;
		border-top: 1px solid color-mix(in srgb, var(--color-accent) 10%, transparent);
		background-color: var(--color-bg, transparent);
		overflow-y: auto;
	}
</style>
