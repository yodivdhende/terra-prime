<script lang="ts">
	import { X } from '@lucide/svelte';
	import { type CodexWindow } from '$lib/codex/services/window-service.svelte';
	import { WINDOW_SERVICE } from '$lib/codex/services/window-service.svelte';

let { context = $bindable() }: { context: CodexWindow } = $props();

	let styleString = $derived(`
    top: ${context.position.y}px;
    left: ${context.position.x}px;
    width: ${context.dimension.w}px;
    height: ${context.dimension.h}px;
  `);

	function closeWindow() {
		WINDOW_SERVICE.closeWindow(context.id);
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

	type ResizeEdge = 's' | 'e' | 'w' | 'se' | 'sw' | null;

	function resizable(node: HTMLElement) {
		let edge: ResizeEdge = null;
		let startX: number, startY: number;
		let originX: number, originY: number;
		let originW: number, originH: number;
		const THRESHOLD = 6; // px from border to trigger resize

		function getEdge(e: MouseEvent): ResizeEdge {
			const { left, right, bottom } = node.getBoundingClientRect();
			const x = e.clientX;
			const y = e.clientY;

			const onLeft = x - left < THRESHOLD;
			const onRight = right - x < THRESHOLD;
			const onBottom = bottom - y < THRESHOLD;

			if (onBottom && onLeft) return 'sw';
			if (onBottom && onRight) return 'se';
			if (onBottom) return 's';
			if (onLeft) return 'w';
			if (onRight) return 'e';
			return null;
		}

		const cursors: Record<NonNullable<ResizeEdge>, string> = {
			s: 's-resize',
			e: 'e-resize',
			w: 'w-resize',
			se: 'se-resize',
			sw: 'sw-resize'
		};

		function onMouseMove(e: MouseEvent) {
			if (!edge) {
				const detected = getEdge(e);
				node.style.cursor = detected ? cursors[detected] : 'default';
				return;
			}

			const dx = e.clientX - startX;
			const dy = e.clientY - startY;
			const MIN = 200;

			// Horizontal
			if (edge.includes('e')) {
				context.dimension.w = Math.max(MIN, originW + dx);
			}
			if (edge.includes('w')) {
				const newW = Math.max(MIN, originW - dx);
				context.position.x = originX + (originW - newW);
				context.dimension.w = newW;
			}

			// Vertical
			if (edge.includes('s')) {
				context.dimension.h = Math.max(MIN, originH + dy);
			}
			if (edge.includes('n')) {
				const newH = Math.max(MIN, originH - dy);
				context.position.y = originY + (originH - newH);
				context.dimension.h = newH;
			}
		}

		function onMouseDown(e: MouseEvent) {
			edge = getEdge(e);
			if (!edge) return;

			startX = e.clientX;
			startY = e.clientY;
			originX = context.position.x;
			originY = context.position.y;
			originW = context.dimension.w;
			originH = context.dimension.h;

			window.addEventListener('mousemove', onMouseMove);
			window.addEventListener('mouseup', onMouseUp);
			e.preventDefault();
			e.stopPropagation(); // prevent draggable from firing
		}

		function onMouseUp() {
			edge = null;
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		}

		node.addEventListener('mousedown', onMouseDown);
		node.addEventListener('mousemove', onMouseMove);
		return {
			destroy() {
				node.removeEventListener('mousedown', onMouseDown);
				node.removeEventListener('mousemove', onMouseMove);
			}
		};
	}
</script>

<main style={styleString} use:draggable use:resizable>
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
		border: 2px solid var(--accent);
		box-shadow:
			var(--accent) 0 0 16px,
			var(--accent) 0 0 4px inset;
		background-color: var(--bg);
		font-family: 'Courier New', Courier, monospace;
		overflow: hidden;
	}

	.header {
		display: flex;
		align-items: center;
		background-color: var(--accent);
		color: black;
		padding: 0.35rem 0.75rem;
		cursor: grab;
		font-size: 0.7rem;
		font-weight: bold;
		letter-spacing: 0.06em;
		flex-shrink: 0;
	}

	.header:active {
		cursor: grabbing;
	}

	.title {
		flex: 1;
		text-transform: uppercase;
		user-select: none;
	}

	.header button {
		background: none;
		border: none;
		color: black;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		opacity: 0.7;
		transition: opacity 0.1s;
	}

	.header button:hover {
		opacity: 1;
	}

	.content {
		flex: 1;
		overflow: auto;
		background-color: var(--bg);
		color: var(--text-result);
		padding: 1rem;
		font-size: 0.85rem;
		line-height: 1.6;
		text-shadow: var(--phosphor-glow);
	}
</style>
