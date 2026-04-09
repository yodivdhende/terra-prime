<script lang="ts">
	import Desktop from '$lib/codex/components/desktop.svelte';
	import Taskbar from '$lib/codex/components/taskbar.svelte';
</script>

<div class="crt-perspective">
	<main>
		<Desktop></Desktop>
		<Taskbar></Taskbar>
	</main>
	<div class="vignette"></div>
	<div class="scanlines"></div>
</div>

<style>
	@import '$lib/styles/stemtest.css';

	main {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background-color: var(--bg);
		font-family: 'Courier New', Courier, monospace;
		border-radius: 4px;
		transform: rotateX(1deg);
		transform-origin: center center;
	}

	.crt-perspective {
		position: relative;
		width: 100vw;
		height: 100vh;
		perspective-origin: center;
		perspective: 500px;
		overflow: hidden;
		transform-style: preserve-3d;
		background-color: black;
	}

	.vignette {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.6) 100%);
		z-index: 9999;
		transform: rotateX(1deg);
		transform-origin: center center;
	}

	.scanlines {
		pointer-events: none;
		position: fixed;
		inset: 0;
		z-index: 10;
		opacity: 1;
		transition: opacity 1s ease;
		background: repeating-linear-gradient(
			to bottom,
			transparent 0px,
			transparent 3px,
			rgba(0, 0, 0, 0.15) 3px,
			rgba(0, 0, 0, 0.15) 4px
		);
		transform: rotateX(1deg);
		transform-origin: center center;
	}
</style>
