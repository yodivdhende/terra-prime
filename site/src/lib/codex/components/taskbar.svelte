<script lang="ts">
	import SearchBar from '$lib/codex/components/search-bar.svelte';
	import Tray from '$lib/codex/components/tray.svelte';
</script>

<main>
	<SearchBar />
	<Tray />
</main>

<style>
	main {
		width: 100%;
		height: min-content;
		flex-shrink: 0;
		background-color: var(--color-bg);
		border-top: 2px solid var(--color-accent);
		box-shadow: var(---color-accent) 0 0 8px;
		color: var(--color-main-dim);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.05em;
		display: flex;
		align-items: center;
		padding: 0 1rem;
		gap: 1rem;
		margin: 0 0 1em 1em;
		padding: 0;
	}
</style>
