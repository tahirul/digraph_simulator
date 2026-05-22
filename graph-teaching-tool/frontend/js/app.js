// App Orchestrator: wires modules together and starts the app
// Responsibilities: cache elements, create graph, init modules, bind events, kick off init
import * as Canvas from './render/canvas.js';
import * as API from './io/api.js';
import { Graph } from './core/graph.js';
import { initTitleEdit, resetTitle, setTitle, getTitle } from './ui/title.js';
import { appendStatus, clearStatusLog, initTimeline, initTimelineResize } from './ui/timeline.js';
import { initPanels, showInputPanel, showPlaybackPanel, updateDirectedButtonState, updateNodeDropdowns } from './ui/panels.js';
import { initPlaybackControls, updatePlaybackButtonStates } from './controls/playback.js';
import { initFileIO } from './io/files.js';

// Cached DOM refs and graph instance
const elements = {}; // DOM elements
let graph; // Graph.loadFromLocalStorage() / new Graph()

// Bootstrap: cache frequently used elements
function cacheElements() {
	elements.canvas = document.getElementById('graph-canvas');
	elements.status = document.getElementById('status');
	elements.graphTitle = document.getElementById('graph-title');
	elements.directedButton = document.getElementById('btn-toggle-directed');
	elements.downloadButton = document.getElementById('btn-download');
	elements.uploadButton = document.getElementById('btn-upload');
	elements.fileInput = document.getElementById('file-input');
	elements.clearButton = document.getElementById('btn-clear');
	elements.runButton = document.getElementById('btn-run');
	elements.algorithm = document.getElementById('algorithm');
	elements.startNodeSelect = document.getElementById('start-node');
	elements.endNodeSelect = document.getElementById('end-node');
	elements.playPauseButton = document.getElementById('btn-play-pause');
	elements.rewindButton = document.getElementById('btn-rewind');
	elements.stepBackButton = document.getElementById('btn-step-back');
	elements.stepForwardButton = document.getElementById('btn-step-forward');
	elements.stopButton = document.getElementById('btn-stop');
	elements.panelInput = document.querySelector('.panel--input');
	elements.panelPlayback = document.querySelector('.panel--playback');
	elements.statusPill = document.querySelector('.pill-status');
	elements.dragHandle = document.getElementById('status-drag-handle');
}

// Timeline: poll window.statusMessage to append updates
function startStatusPolling() {
	setInterval(() => {
		if (window.statusMessage) {
			appendStatus(window.statusMessage);
			window.statusMessage = null;
		}
	}, 50);
}

// UI: Directed toggle wiring
function graphToggle() {
	updateDirectedButtonState();
	elements.directedButton.addEventListener('click', () => {
		const newDirected = !graph.isDirected;
		graph.setGlobalDirected(newDirected);
		updateDirectedButtonState();
		appendStatus(newDirected ? 'Graph is now directed' : 'Graph is now undirected');
	});
}

// UI: Clear graph and reset UI
function clear() {
    elements.clearButton.addEventListener('click', () => {
		graph.nodes = [];
		graph.edges = [];
		graph.nextNodeId = 1;
		graph.saveToLocalStorage();
		Canvas.resetPathHighlight();
		clearStatusLog();
		updateNodeDropdowns();
		elements.startNodeSelect.value = '';
		elements.endNodeSelect.value = '';
		graph.setGlobalDirected(false);
		updateDirectedButtonState();
		resetTitle(elements.graphTitle);
		appendStatus('Canvas cleared');
	});
}



// UI: Run algorithm (validate, execute, start playback)
function Run() {
	elements.runButton.addEventListener('click', async () => {
		const startNodeId = elements.startNodeSelect.value;
		const endNodeId = elements.endNodeSelect.value;
		
		if (!startNodeId) {
			appendStatus('Error: Please select a start node');
			return;
		}
		
		if (endNodeId && startNodeId === endNodeId) {
			appendStatus('Error: Start and end nodes cannot be the same');
			return;
		}

		const algorithm = elements.algorithm.value;
		const startNode = parseInt(startNodeId);
		const endNode = endNodeId ? parseInt(endNodeId) : null;

		// Validate graph
		const serialized = graph.serialize();
		const validation = await API.validateGraph(serialized);
		if (!validation.valid) {
			appendStatus(`Invalid: ${validation.error}`);
			return;
		}

		// Run algorithm
		const result = await API.runAlgorithm(serialized, algorithm, startNode, endNode);
		if (!result.success) {
			appendStatus(result.error || 'Algorithm error');
			return;
		}

		// Start playback
		Canvas.playTrace(result.steps);
		elements.playPauseButton.setAttribute('data-state', 'playing');
		elements.playPauseButton.textContent = '⏸ Pause';
		updatePlaybackButtonStates();
		appendStatus(`Running ${algorithm}`);
		showPlaybackPanel();
	});
}

// App init: cache elements, build graph, init modules, bind UI
function init() {
	// Initialize
	cacheElements();
	graph = Graph.loadFromLocalStorage() || new Graph();
	Canvas.init(elements.canvas, graph);
	initTimeline({ status: elements.status, statusPill: elements.statusPill, dragHandle: elements.dragHandle });
	initPanels({
		graph,
		panelInput: elements.panelInput,
		panelPlayback: elements.panelPlayback,
		directedButton: elements.directedButton,
		startNodeSelect: elements.startNodeSelect,
		endNodeSelect: elements.endNodeSelect,
	});
	clearStatusLog();
	updateNodeDropdowns();
	updateDirectedButtonState();
	initTitleEdit(elements.graphTitle);
	
	// Hook into graph mutations to update dropdowns
	const originalAddNode = graph.addNode.bind(graph);
	const originalDeleteNode = graph.deleteNode.bind(graph);
	
	graph.addNode = function(...args) {
		const result = originalAddNode(...args);
		updateNodeDropdowns();
		return result;
	};
	
	graph.deleteNode = function(...args) {
		const result = originalDeleteNode(...args);
		updateNodeDropdowns();
		return result;
	};
	
	appendStatus('Ready');

	// Setup UI
	graphToggle();
    clear()
	initFileIO({
		graph,
		downloadButton: elements.downloadButton,
		uploadButton: elements.uploadButton,
		fileInput: elements.fileInput,
		onUploadSuccess: (loadedGraph, filename) => {
			graph.replaceWith(loadedGraph);
			setTitle(elements.graphTitle, filename);
			appendStatus('Graph loaded: ' + filename);
			graph.saveToLocalStorage();
			updateNodeDropdowns();
			graph.setGlobalDirected(loadedGraph.isDirected);
			updateDirectedButtonState();
		},
		onUploadSuccess: Object.assign(
			(loadedGraph, filename) => {
				graph.replaceWith(loadedGraph);
				setTitle(elements.graphTitle, filename);
				appendStatus('Graph loaded: ' + filename);
				graph.saveToLocalStorage();
				updateNodeDropdowns();
				graph.setGlobalDirected(loadedGraph.isDirected);
				updateDirectedButtonState();
			},
			{ onError: () => appendStatus('Invalid file') }
		),
	});
	Run();
	initPlaybackControls({
		canvas: Canvas,
		appendStatus,
		showInputPanel,
		playPauseButton: elements.playPauseButton,
		rewindButton: elements.rewindButton,
		stepBackButton: elements.stepBackButton,
		stepForwardButton: elements.stepForwardButton,
		stopButton: elements.stopButton,
	});
	updatePlaybackButtonStates();
	showInputPanel();
	initTimelineResize();

	// Start polling
	startStatusPolling();
}

// Start the app once DOM is ready
document.addEventListener('DOMContentLoaded', init);
