<script lang="ts">
	import Desktop from '$lib/codex/components/desktop.svelte';
	import Taskbar from '$lib/codex/components/taskbar.svelte';
</script>

<div class="crt-perspective">
	<main>
		<Desktop></Desktop>
		<Taskbar></Taskbar>
	</main>
</div>

<style>
	@import '$lib/styles/stemtest.css';

	.crt-perspective {
		width: 100vw;
		height: 100vh;
		perspective: 800px;
		background-color: var(--bg);
	}

	main {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background-color: var(--bg);
		font-family: 'Courier New', Courier, monospace;
		transform: rotateX(1deg);
		border-radius: 4px;
		transform-origin: center center;
	}
</style>
