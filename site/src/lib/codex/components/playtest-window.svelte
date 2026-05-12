<script lang="ts">
	import { type CodexWindow } from '$lib/codex/managers/window-manager.svelte';
	import PlaytestForm from '$lib/components/playtest-form.svelte';

	let { window }: { window: CodexWindow } = $props();
</script>

<div class="playtest">
	<PlaytestForm action="/info" />
</div>

<style>
	.playtest {
		padding: 1rem 1.25rem;
		overflow-y: auto;
		height: 100%;
		color: var(--color-main);
		font-family: var(--font-mono);
		font-size: 0.85rem;
	}
</style>
