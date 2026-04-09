<script lang="ts">
	import Desktop from '$lib/codex/components/desktop.svelte';
	import Taskbar from '$lib/codex/components/taskbar.svelte';
</script>

<main class="crt-perspective">
	<Desktop></Desktop>
	<Taskbar></Taskbar>
</main>
<div class="vignette"></div>
<div class="scanlines"></div>

<style>
	@import '$lib/styles/stemtest.css';

	main {
		display: flex;
		flex-direction: column;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		background-color: var(--bg);
		font-family: 'Courier New', Courier, monospace;
		transform: rotateX(1deg);
		border-radius: 4px;
		transform-origin: center center;
	}

	/* .crt-perspective { */
	/* 	perspective: 800px; */

	/* } */

	/* .vignette { */
	/* 	position: absolute; */
	/* 	inset: 0; */
	/* 	pointer-events: none; */
	/* 	background: radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.6) 100%); */
	/* 	z-index: 9999; */
	/* } */

	/* .scanlines { */
	/* 	pointer-events: none; */
	/* 	position: fixed; */
	/* 	inset: 0; */
	/* 	z-index: 10; */
	/* 	opacity: 1; */
	/* 	transition: opacity 1s ease; */
	/* 	background: repeating-linear-gradient( */
	/* 		to bottom, */
	/* 		transparent 0px, */
	/* 		transparent 3px, */
	/* 		rgba(0, 0, 0, 0.15) 3px, */
	/* 		rgba(0, 0, 0, 0.15) 4px */
	/* 	); */
	/* } */
</style>
