<script lang="ts">
	import { scene } from './model.svelte';

	let svg: SVGSVGElement;
	let dragging: number | null = null;
	let offset = { x: 0, y: 0 };

	function toSvg(e: PointerEvent) {
		const pt = svg.createSVGPoint();
		pt.x = e.clientX;
		pt.y = e.clientY;
		return pt.matrixTransform(svg.getScreenCTM()!.inverse());
	}

	function nodeDown(e: PointerEvent, id: number) {
		e.stopPropagation();
		if (e.shiftKey && scene.selected) {
			scene.toggleMember(scene.selected, id);
			return;
		}
		const p = toSvg(e);
		const n = scene.node(id)!;
		offset = { x: n.x - p.x, y: n.y - p.y };
		dragging = id;
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
	}

	function move(e: PointerEvent) {
		if (dragging === null) return;
		const p = toSvg(e);
		scene.moveNode(dragging, p.x + offset.x, p.y + offset.y);
	}

	function up() {
		dragging = null;
	}

	function addPolygon() {
		const r = svg.getBoundingClientRect();
		const j = () => (Math.random() - 0.5) * 200;
		scene.addPolygon(r.width / 2 + j(), r.height / 2 + j());
	}

	/** Double-click empty canvas: new node appended to the selected polygon. */
	function canvasDblClick(e: MouseEvent) {
		if (!scene.selected) return;
		const pt = svg.createSVGPoint();
		pt.x = e.clientX;
		pt.y = e.clientY;
		const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
		scene.selected.nodeIds.push(scene.addNode(p.x, p.y).id);
	}

	const selectedNodes = $derived(new Set(scene.selected?.nodeIds ?? []));
</script>

<main>
	<aside>
		<h1>Polygons</h1>
		<button onclick={addPolygon}>+ Add polygon</button>
		<p class="hint">
			Drag nodes to move them. Select a polygon, then <b>shift+click</b> a node to add it to or
			remove it from that polygon (nodes can be shared). <b>Double-click</b> empty space to add a
			new node to the selected polygon.
		</p>
		<ul>
			{#each scene.polygons as p (p.id)}
				<li class:active={p.id === scene.selectedId}>
					<button class="row" onclick={() => (scene.selectedId = p.id)}>
						Polygon {p.id} ({p.nodeIds.length} nodes)
					</button>
					{#if p.id === scene.selectedId}
						<label>Surface <input type="color" bind:value={p.fill} /></label>
						<label>Edge <input type="color" bind:value={p.stroke} /></label>
						<button class="danger" onclick={() => scene.removePolygon(p.id)}>Delete</button>
					{/if}
				</li>
			{/each}
		</ul>
	</aside>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<svg bind:this={svg} onpointermove={move} onpointerup={up} ondblclick={canvasDblClick}>
		{#each scene.polygons as p (p.id)}
			<polygon
				points={scene.points(p)}
				fill={p.fill}
				stroke={p.stroke}
				stroke-width={p.id === scene.selectedId ? 3 : 2}
				stroke-linejoin="round"
				onpointerdown={(e) => {
					e.stopPropagation();
					scene.selectedId = p.id;
				}}
			/>
		{/each}
		{#each scene.nodes as n (n.id)}
			<circle
				cx={n.x}
				cy={n.y}
				r="7"
				class:member={selectedNodes.has(n.id)}
				onpointerdown={(e) => nodeDown(e, n.id)}
			/>
		{/each}
	</svg>
</main>

<style>
	main {
		display: flex;
		height: 100%;
	}
	aside {
		width: 260px;
		padding: 1rem;
		background: #1a1d26;
		overflow-y: auto;
		box-sizing: border-box;
	}
	h1 {
		margin: 0 0 1rem;
		font-size: 1.2rem;
	}
	.hint {
		font-size: 0.8rem;
		opacity: 0.7;
	}
	ul {
		list-style: none;
		padding: 0;
	}
	li {
		margin-bottom: 0.4rem;
		padding: 0.3rem;
		border-radius: 6px;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	li.active {
		background: #262b3a;
	}
	label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
	}
	button {
		background: #2f3650;
		color: inherit;
		border: 0;
		border-radius: 4px;
		padding: 0.4rem 0.6rem;
		cursor: pointer;
	}
	.row {
		text-align: left;
		background: none;
	}
	.danger {
		background: #6b2b33;
	}
	svg {
		flex: 1;
		min-width: 0;
		height: 100%;
		touch-action: none;
		background: #0e1016;
	}
	circle {
		fill: #fff;
		stroke: #333;
		stroke-width: 2;
		cursor: grab;
	}
	circle.member {
		fill: #ffd04f;
	}
	circle:active {
		cursor: grabbing;
	}
</style>
