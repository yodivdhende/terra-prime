<script lang="ts">
	import { X } from '@lucide/svelte';
	import { type CodexWindow } from '$lib/codex/services/window-service.svelte';

	let { context = $bindable() }: { context: CodexWindow } = $props();

	let styleString = $derived(`
    top: ${context.position.y}px;
    left: ${context.position.x}px;
    width: ${context.dimension.w}px;
    height: ${context.dimension.h}px;
  `);

	function closeWindow() {
		console.log('closeWindow');
	}

	function draggable(node: HTMLElement) {
		let startX: number;
		let startY: number;
		let originX: number;
		let originY: number;
		let dragging = false;

		function onMouseDown(e: MouseEvent) {
			if (!(e.target as HTMLElement).closest('.title')) return;
			dragging = true;
			startX = e.clientX;
			startY = e.clientY;
			originX = context.position.x;
			originY = context.position.y;

			window.addEventListener('mousemove', onMouseMove);
			window.addEventListener('mouseup', onMouseUp);
		}

		function onMouseMove(e: MouseEvent) {
			if (!dragging) return;
			context.position.x = originX + (e.clientX - startX);
			context.position.y = originY + (e.clientY - startY);
		}

		function onMouseUp() {
			dragging = false;
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		}

		node.addEventListener('mousedown', onMouseDown);
		return {
			destroy() {
				node.removeEventListener('mousedown', onMouseDown);
			}
		};
	}
</script>

<main style={styleString} use:draggable>
	<div class="header">
		<div class="title">{context.title}</div>
		<button onclick={closeWindow}> <X /> </button>
	</div>
	<div class="content">
		{context.content}
	</div>
</main>

<style>
	main {
		position: absolute;
		display: flex;
		flex-direction: column;
		border: 1px solid green;
		/* add glow */
	}

	.header {
		display: flex;
		align-items: center;
		background-color: green;
		padding: 0.5em;
		cursor: pointer;
	}

	.header button {
		background: none;
		border: none;
	}

	.title {
		width: 100%;
	}

	.content {
		width: 100%;
		height: 100%;
		background-color: black;
		color: white;
	}
</style>
