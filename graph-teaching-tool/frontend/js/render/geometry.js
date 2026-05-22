// render/geometry.js
import { NODE_MIN_RADIUS, NODE_MAX_RADIUS } from './constants.js';

export function clamp(val, min, max){
	return Math.max(min, Math.min(max, val));
}

export function computeNodeRadius(node, viewportWidth){
	const rawLabel = node.label || String(node.id);
	const labelLength = Math.min(rawLabel.length, 10);
	const vwComponent = viewportWidth * 0.012 + 8; // ~ viewport scaled + 1rem base
	const charBoost = labelLength * 0.8; // proportional growth per character
	const preferred = vwComponent + charBoost;
	return clamp(preferred, NODE_MIN_RADIUS, NODE_MAX_RADIUS);
}

export function getNodeAtPoint(x, y, graph, viewportWidth) {
	for (let i = graph.nodes.length - 1; i >= 0; i--) {
		const node = graph.nodes[i];
		const r = computeNodeRadius(node, viewportWidth);
		const dx = node.x - x;
		const dy = node.y - y;
		if (dx * dx + dy * dy <= r * r) return node;
	}
	return null;
}

export function isBidirectionalEdge(e1, graph){
	return graph.edges.some(e2 => 
		e2.id !== e1.id && 
		e2.source === e1.target && 
		e2.target === e1.source
	);
}

export function getEdgeMidpoint(x1, y1, x2, y2, offset){
	const dx = x2 - x1;
	const dy = y2 - y1;
	const dist = Math.sqrt(dx * dx + dy * dy);
	const perpX = -dy / dist;
	const perpY = dx / dist;
	const mx = (x1 + x2) / 2 + perpX * offset;
	const my = (y1 + y2) / 2 + perpY * offset;
	return { x: mx, y: my };
}

export function screenToCanvas(ev, canvas){
	const r = canvas.getBoundingClientRect();
	return { x: ev.clientX - r.left, y: ev.clientY - r.top };
}
