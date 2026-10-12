export interface PolyNode {
	id: number;
	x: number;
	y: number;
}

export interface Polygon {
	id: number;
	/** Ordered node ids; nodes may be shared with other polygons. */
	nodeIds: number[];
	fill: string;
	stroke: string;
}

class Scene {
	nodes = $state<PolyNode[]>([]);
	polygons = $state<Polygon[]>([]);
	selectedId = $state<number | null>(null);
	#nextNode = 1;
	#nextPolygon = 1;

	selected = $derived(this.polygons.find((p) => p.id === this.selectedId) ?? null);

	node(id: number) {
		return this.nodes.find((n) => n.id === id);
	}

	addNode(x: number, y: number): PolyNode {
		const node = { id: this.#nextNode++, x, y };
		this.nodes.push(node);
		return node;
	}

	moveNode(id: number, x: number, y: number) {
		const n = this.node(id);
		if (n) {
			n.x = x;
			n.y = y;
		}
	}

	addPolygon(cx: number, cy: number, fill = '#4f8cff80', stroke = '#9fc0ff'): Polygon {
		const r = 80;
		const nodeIds = [0, 1, 2].map((i) => {
			const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
			return this.addNode(cx + r * Math.cos(a), cy + r * Math.sin(a)).id;
		});
		const polygon = { id: this.#nextPolygon++, nodeIds, fill, stroke };
		this.polygons.push(polygon);
		this.selectedId = polygon.id;
		return polygon;
	}

	/** Add the node to the polygon, or remove it if already a member (min 3 nodes kept). */
	toggleMember(polygon: Polygon, nodeId: number) {
		const i = polygon.nodeIds.indexOf(nodeId);
		if (i === -1) polygon.nodeIds.push(nodeId);
		else if (polygon.nodeIds.length > 3) polygon.nodeIds.splice(i, 1);
	}

	removePolygon(id: number) {
		this.polygons = this.polygons.filter((p) => p.id !== id);
		if (this.selectedId === id) this.selectedId = null;
		this.#pruneNodes();
	}

	/** Drop nodes no polygon uses any more. */
	#pruneNodes() {
		const used = new Set(this.polygons.flatMap((p) => p.nodeIds));
		this.nodes = this.nodes.filter((n) => used.has(n.id));
	}

	points(p: Polygon) {
		return p.nodeIds
			.map((id) => this.node(id))
			.filter((n): n is PolyNode => !!n)
			.map((n) => `${n.x},${n.y}`)
			.join(' ');
	}
}

export const scene = new Scene();
