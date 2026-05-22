// render/nodes.js
import { NODE_BORDER, NODE_HOVER_SCALE, NODE_COLORS } from './constants.js';
import { computeNodeRadius, clamp } from './geometry.js';
import * as Menu from '../ui/menu.js';

function formatLabel(text){
	if (!text && text !== 0) return '';
	const str = String(text);
	return str.length > 7 ? str.slice(0, 7) + '...' : str;
}

function getNodeState(node){
	if (node.current) return 'current';
	if (node.visited) return 'visited';
	return 'base';
}

export function drawNodes(ctx, graph, hoverNodeId, selectedNodeId, viewportWidth){
	graph.nodes.forEach(node => {
		const state = getNodeState(node);
		const palette = NODE_COLORS[state];
		let radius = computeNodeRadius(node, viewportWidth);
		const isHovered = hoverNodeId === node.id;
		const isSelected = selectedNodeId === node.id || Menu.getActiveNodeId() === node.id;
		if (isHovered || isSelected) {
			radius *= NODE_HOVER_SCALE;
		}

		// Gradient fill
		const grad = ctx.createLinearGradient(node.x - radius, node.y - radius, node.x + radius, node.y + radius);
		grad.addColorStop(0, palette.from);
		grad.addColorStop(1, palette.to);

		ctx.save();
		ctx.shadowColor = palette.shadow;
		ctx.shadowBlur = 5;
		ctx.shadowOffsetX = 5;
		ctx.shadowOffsetY = 5;

		ctx.beginPath();
		ctx.fillStyle = grad;
		ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();

		// Border (crisp, no shadow)
		ctx.save();
		ctx.shadowBlur = 0;
		ctx.lineWidth = 1.25;
		ctx.strokeStyle = NODE_BORDER;
		ctx.beginPath();
		ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
		ctx.stroke();
		ctx.restore();

		// Highlight ring for selection
		if (isSelected) {
			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.strokeStyle = palette.from;
			ctx.arc(node.x, node.y, radius + 1.5, 0, Math.PI * 2);
			ctx.stroke();
		}

		// Label
		const displayLabel = formatLabel(node.label || node.id);
		const fontPx = clamp(radius * 0.55, 10, 18);
		ctx.font = `${fontPx}px Arial`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'rgba(255,255,255,0.9)';
		ctx.fillStyle = '#ffffff';
		ctx.strokeText(displayLabel, node.x, node.y);
		ctx.fillText(displayLabel, node.x, node.y);
	});
}
