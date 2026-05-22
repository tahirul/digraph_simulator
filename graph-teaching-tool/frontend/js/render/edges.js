// render/edges.js
import { EDGE_CURVE_OFFSET, EDGE_LINE_WIDTH, SELF_LOOP_RADIUS, EDGE_WEIGHT_FONT_SIZE, ARROW_HEAD_LEN } from './constants.js';
import { computeNodeRadius, isBidirectionalEdge, getEdgeMidpoint } from './geometry.js';

// TODO: Known edge bugs to triage:
// - Self-loops: selection toggles off when clicking the same node twice, so the loop never draws.
// - Edge context menu: right-click hit/placement still assumes straight edges and ignores curved offsets.

function drawCurvedEdge(ctx, x1, y1, x2, y2, offset){
	const dx = x2 - x1;
	const dy = y2 - y1;
	const dist = Math.sqrt(dx * dx + dy * dy);
	const perpX = -dy / dist;
	const perpY = dx / dist;
	const cpx = (x1 + x2) / 2 + perpX * offset;
	const cpy = (y1 + y2) / 2 + perpY * offset;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.quadraticCurveTo(cpx, cpy, x2, y2);
	ctx.stroke();
}

function drawSelfLoop(ctx, x, y, radius){
	const loopRadius = SELF_LOOP_RADIUS;
	ctx.beginPath();
	ctx.arc(x, y - radius - loopRadius, loopRadius, -Math.PI, 0);
	ctx.stroke();
}

function drawArrowHeadAt(ctx, endX, endY, dirX, dirY, targetRadius, headlen = ARROW_HEAD_LEN){
	// Normalize direction
	const len = Math.hypot(dirX, dirY) || 1;
	const ux = dirX / len;
	const uy = dirY / len;
	// Position arrowhead to touch the target node perimeter
	const x2 = endX - ux * targetRadius;
	const y2 = endY - uy * targetRadius;
	const angle = Math.atan2(uy, ux);
	ctx.fillStyle = '#000';
	ctx.beginPath();
	ctx.moveTo(x2, y2);
	ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
	ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
	ctx.closePath();
	ctx.fill();
}

export function drawEdges(ctx, graph, activeEdgeId, currentPathEdges, allTraversedEdges, viewportWidth){
	graph.edges.forEach(e => {
		const a = graph.nodeById(e.source);
		const b = graph.nodeById(e.target);
		if (!a || !b) return; // invalid edge
		
		// Self-loop: draw as arc above node
		if (e.source === e.target) {
			const nodeRadius = computeNodeRadius(a, viewportWidth);
			const isHighlighted = activeEdgeId === e.id;
			let edgeColor = '#000';
			if (isHighlighted) {
				edgeColor = '#ff6b6b';
			} else if (currentPathEdges.includes(e.id)) {
				edgeColor = '#ff9800';
			} else if (allTraversedEdges.includes(e.id)) {
				edgeColor = '#aaa';
			}
			ctx.save();
			ctx.strokeStyle = edgeColor;
			ctx.lineWidth = isHighlighted ? 3 : EDGE_LINE_WIDTH;
			ctx.shadowColor = 'rgba(0,0,0,0.06)';
			ctx.shadowBlur = 2;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			drawSelfLoop(ctx, a.x, a.y, nodeRadius);
			ctx.restore();
			return;
		}
		
		// determine if this edge is highlighted (context menu open on it)
		const isHighlighted = activeEdgeId === e.id;
		const isBidir = isBidirectionalEdge(e, graph);
		const curveOffset = isBidir ? EDGE_CURVE_OFFSET : 0;
		
		// Determine edge color based on path highlighting
		let edgeColor = '#000';
		if (isHighlighted) {
			edgeColor = '#ff6b6b'; // red for context menu
		} else if (currentPathEdges.includes(e.id)) {
			edgeColor = '#ff9800'; // orange for current path
		} else if (allTraversedEdges.includes(e.id)) {
			edgeColor = '#aaa'; // grey for traversed but not in final path
		}
		
		ctx.save();
		ctx.strokeStyle = edgeColor;
		ctx.lineWidth = isHighlighted ? 3 : EDGE_LINE_WIDTH;
		ctx.shadowColor = 'rgba(0,0,0,0.06)';
		ctx.shadowBlur = 2;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		if (isBidir) {
			drawCurvedEdge(ctx, a.x, a.y, b.x, b.y, curveOffset);
		} else {
			ctx.beginPath();
			ctx.moveTo(a.x, a.y);
			ctx.lineTo(b.x, b.y);
			ctx.stroke();
		}
		ctx.restore();
		
		// draw arrow if directed
		if (graph.isDirected) {
			const bRadius = computeNodeRadius(b, viewportWidth);
			if (isBidir) {
				// For curved edges, use tangent-based arrow positioning
				const dx = b.x - a.x;
				const dy = b.y - a.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const perpX = -dy / dist;
				const perpY = dx / dist;
				const cpx = (a.x + b.x) / 2 + perpX * curveOffset;
				const cpy = (a.y + b.y) / 2 + perpY * curveOffset;
				// Tangent at end (direction from control point to end)
				const tx = b.x - cpx;
				const ty = b.y - cpy;
				drawArrowHeadAt(ctx, b.x, b.y, tx, ty, bRadius, ARROW_HEAD_LEN);
			} else {
				// For straight edges, use direction from a->b
				const dx = b.x - a.x;
				const dy = b.y - a.y;
				drawArrowHeadAt(ctx, b.x, b.y, dx, dy, bRadius, ARROW_HEAD_LEN);
			}
		}
		
		// edge label (weight) - pill style
		if (e.weight) {
			const midpt = isBidir ? getEdgeMidpoint(a.x, a.y, b.x, b.y, curveOffset) : { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
			const labelText = String(e.weight).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
			ctx.save();
			ctx.font = `${EDGE_WEIGHT_FONT_SIZE}px Arial`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			const metrics = ctx.measureText(labelText);
			const padding = 4;
			const width = metrics.width + padding * 2;
			const height = EDGE_WEIGHT_FONT_SIZE + padding * 1.5;
			
			// Draw pill background
			ctx.fillStyle = 'rgba(248,249,250,0.9)';
			ctx.strokeStyle = 'rgba(224,227,231,0.9)';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.roundRect(midpt.x - width / 2, midpt.y - height / 2, width, height, 3);
			ctx.fill();
			ctx.stroke();
			
			// Draw text
			ctx.fillStyle = '#1f2937';
			ctx.fillText(labelText, midpt.x, midpt.y);
			ctx.restore();
		}
	});
}
