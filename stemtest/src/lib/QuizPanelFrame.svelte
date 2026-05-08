<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		currentIndex,
		quizSize,
		progress,
		children
	}: {
		currentIndex: number;
		quizSize: number;
		progress: number;
		children: Snippet;
	} = $props();
</script>

<div class="panel quiz-panel">
	<div class="header-bar">
		+++ [ ANALYSE ACTIEF — VRAAG {currentIndex + 1} / {quizSize} ] +++
	</div>
	<div class="progress-bar">
		<div class="progress-fill" style="width: {progress}%"></div>
	</div>
	{@render children()}
</div>

<style>
	.panel {
		width: 100%;
		max-width: 720px;
		border: 2px solid var(--accent);
		box-shadow:
			var(--accent) 0 0 16px,
			var(--accent) 0 0 4px inset;
		background-color: var(--bg);
		overflow: hidden;
	}

	.header-bar {
		background-color: var(--accent);
		color: black;
		font-size: 0.75rem;
		font-weight: bold;
		padding: 0.4rem 1rem;
		letter-spacing: 0.05em;
	}

	.progress-bar {
		height: 3px;
		background-color: var(--progress-bg);
	}

	.progress-fill {
		height: 100%;
		background-color: var(--accent);
		transition: width 0.3s ease;
	}

	@media (max-width: 500px) {
		.header-bar {
			font-size: 0.65rem;
		}
	}
</style>
