import * as Menu from '../ui/menu.js';
import { getNodeAtPoint, screenToCanvas } from './geometry.js';
import * as Timeline from '../ui/timeline.js';
import { drawNodes } from './nodes.js';
import { drawEdges } from './edges.js';

// ============================================================
// =============== Global state and constants ==================
// ============================================================

// Canvas and rendering
let canvas;
let ctx; 
let graph;

// Mouse interaction
let potentialDrag = null; // {node, startX, startY}
let dragging = false;
let dragNode = null;
let holdTimeout = null;
const HOLD_DELAY = 150; // ms to hold before starting drag
let selectedNodeId = null; // for edge creation

// Playback and trace
let trace = null, traceIndex = 0, playing = false, isRewinding = false;
let currentPathEdges = []; // Edges in the current found path (orange)
let allTraversedEdges = []; // All edges traversed during algorithm (used for grey highlight)
const STEP_DELAY = 400; // ms between steps

let hoverNodeId = null;

function resize(){
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
}

function loop(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawEdges(ctx, graph, Menu.getActiveEdgeId(), currentPathEdges, allTraversedEdges, window.innerWidth || 1200);
	drawNodes(ctx, graph, hoverNodeId, selectedNodeId, window.innerWidth || 1200);
	requestAnimationFrame(loop);
}

function startDragNow(){
	if (!potentialDrag) return;
	dragging = true;
	dragNode = potentialDrag.node;
	potentialDrag = null;
}

function onMouseDown(ev) {
	// Cancel drag on right-click
	if (ev.button !== 0) {
		if (holdTimeout){ clearTimeout(holdTimeout); holdTimeout = null; }
		potentialDrag = null;
		dragging = false;
		dragNode = null;
		return;
	}
	const pos = screenToCanvas(ev, canvas);
	const node = getNodeAtPoint(pos.x, pos.y, graph, window.innerWidth || 1200);
	if (node){
		potentialDrag = { node: node, startX: pos.x, startY: pos.y };
		dragging = false; dragNode = null;
		holdTimeout = setTimeout(()=> startDragNow(), HOLD_DELAY);
	} else {
		potentialDrag = null;
	}
}

function onMouseMove(ev){
	const pos = screenToCanvas(ev, canvas);
	if (dragging && dragNode){
		dragNode.x = pos.x; dragNode.y = pos.y;
	}

	if (!dragging){
		const hovered = getNodeAtPoint(pos.x, pos.y, graph, window.innerWidth || 1200);
		hoverNodeId = hovered ? hovered.id : null;
	}
}

function onMouseUp(ev){
	if (ev.button !== 0) {
		if (holdTimeout){ clearTimeout(holdTimeout); holdTimeout = null; }
		return;
	}
	const pos = screenToCanvas(ev, canvas);
	if (holdTimeout){ clearTimeout(holdTimeout); holdTimeout = null; }

	if (dragging){
		dragging = false; dragNode = null; potentialDrag = null;
		graph.saveToLocalStorage();
		return;
	}

	const clicked = getNodeAtPoint(pos.x, pos.y, graph, window.innerWidth || 1200);
	if (clicked){
		if (!selectedNodeId){ selectedNodeId = clicked.id; }
		else if (selectedNodeId === clicked.id){ selectedNodeId = null; }
		else {
			try{ graph.addEdge(selectedNodeId, clicked.id); }
			catch(e){ 
				Timeline.appendStatus(e.message);
			}
			selectedNodeId = null;
		}
	} else {
		try{ graph.addNode(pos.x, pos.y); }
		catch(e){ 
			Timeline.appendStatus(e.message);
		}
	}
}

function onRightClick(ev){
	const pos = screenToCanvas(ev, canvas);
	const node = getNodeAtPoint(pos.x, pos.y, graph, window.innerWidth || 1200);
	if (node) {
		ev.preventDefault();
		let menuX = ev.clientX;
		let menuY = ev.clientY - 120;
		if (menuY < 20) { menuY = ev.clientY + 40; }
		Menu.showNodeMenu(node, menuX, menuY, graph);
		return;
	}
	const edge = graph.getEdgeAt(pos.x, pos.y, 15);
	if (edge) {
		ev.preventDefault();
		Menu.showEdgeMenu(edge, ev.clientX, ev.clientY - 80, graph);
	}
}

function renderStep(index){
	if (!trace || index < 0 || index >= trace.length) return;
	allTraversedEdges = [];
	for (let i = 0; i <= index; i++) {
		if (trace[i].traversedEdges) {
			allTraversedEdges = [...new Set([...allTraversedEdges, ...trace[i].traversedEdges])];
		}
	}
	const s = trace[index];
	if (s.pathToEnd) {
		currentPathEdges = [];
		for (let i = 0; i < s.pathToEnd.length - 1; i++) {
			const u = s.pathToEnd[i];
			const v = s.pathToEnd[i + 1];
			const edge = graph.edges.find(e => 
				(e.source === u && e.target === v) || (e.source === v && e.target === u)
			);
			if (edge) currentPathEdges.push(edge.id);
		}
	} else {
		currentPathEdges = [];
	}
	graph.nodes.forEach(n=>{ n.visited = s.visited?.includes(n.id); n.current = n.id===s.current; });
	graph.saveToLocalStorage();
	if (s.message) { window.statusMessage = s.message; }
}

function step(){ 
	if (!trace) return;
	if (isRewinding) {
		if (traceIndex <= 0) { playing = false; isRewinding = false; return; }
		traceIndex--; renderStep(traceIndex);
		if (playing && isRewinding) setTimeout(()=> step(), STEP_DELAY);
	} else {
		const s = trace[traceIndex++]; 
		if (!s) { playing=false; return; }
		if (s.pathToEnd) {
			currentPathEdges = [];
			for (let i = 0; i < s.pathToEnd.length - 1; i++) {
				const u = s.pathToEnd[i];
				const v = s.pathToEnd[i + 1];
				const edge = graph.edges.find(e => 
					(e.source === u && e.target === v) || (e.source === v && e.target === u)
				);
				if (edge) currentPathEdges.push(edge.id);
			}
		} else { currentPathEdges = []; }
		if (s.traversedEdges) { allTraversedEdges = [...new Set([...allTraversedEdges, ...s.traversedEdges])]; }
		graph.nodes.forEach(n=>{ n.visited = s.visited?.includes(n.id); n.current = n.id===s.current; });
		graph.saveToLocalStorage();
		if (s.message) { window.statusMessage = s.message; }
		if (playing && traceIndex < trace.length) setTimeout(()=> step(), STEP_DELAY);
	}
}

export function init(c, g){
	canvas = c; ctx = canvas.getContext('2d'); graph = g;
	resize(); window.addEventListener('resize', resize);
	ctx.font = '12px sans-serif';
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';
	canvas.addEventListener('mousedown', onMouseDown);
	canvas.addEventListener('mousemove', onMouseMove);
	canvas.addEventListener('mouseup', onMouseUp);
	canvas.addEventListener('contextmenu', onRightClick);
	loop();
}

export function playTrace(steps){ 
	currentPathEdges = []; allTraversedEdges = []; trace = steps; traceIndex = 0; playing = true; isRewinding = false; step(); 
}
export function play(){ if (!trace || traceIndex >= trace.length) return; if (playing && !isRewinding) return; playing = true; isRewinding = false; step(); }
export function pause(){ playing = false; }
export function stop(){ playing = false; isRewinding = false; traceIndex = 0; currentPathEdges = []; allTraversedEdges = []; graph.nodes.forEach(n=>{ n.visited = false; n.current = false; }); graph.saveToLocalStorage(); }
export function rewind(){ if (traceIndex <= 0) return; playing = true; isRewinding = true; step(); }
export function stepForward(){ if (!playing && trace && traceIndex < trace.length) { step(); } }
export function stepBackward(){ if (!playing && trace && traceIndex > 0) { traceIndex--; renderStep(traceIndex); } }
export function resetPathHighlight(){ currentPathEdges = []; allTraversedEdges = []; }
export function getIsPlaying(){ return playing; }
export function getIsAnimating(){ return isRewinding; }
export function getTrace(){ return trace; }
export function getTraceIndex(){ return traceIndex; }
