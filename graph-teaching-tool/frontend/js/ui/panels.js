let graphRef = null;
let els = {};

export function initPanels({ graph, panelInput, panelPlayback, directedButton, startNodeSelect, endNodeSelect }) {
	graphRef = graph;
	els = { panelInput, panelPlayback, directedButton, startNodeSelect, endNodeSelect };
}

export function showInputPanel() {
	els.panelInput?.classList.remove('is-hidden');
	els.panelPlayback?.classList.add('is-hidden');
}

export function showPlaybackPanel() {
	els.panelPlayback?.classList.remove('is-hidden');
	els.panelInput?.classList.add('is-hidden');
}

export function updateDirectedButtonState() {
	if (!graphRef || !els.directedButton) return;
	const isDirected = graphRef.isDirected;
	const icon = isDirected ? '→' : '↔';
	const text = isDirected ? 'Directed' : 'Undirected';
	els.directedButton.textContent = `${icon} ${text}`;
}

export function updateNodeDropdowns() {
	if (!graphRef || !els.startNodeSelect || !els.endNodeSelect) return;
	// TODO: Refresh dropdowns on node rename as well (currently updates only on add/delete).
	const currentStart = els.startNodeSelect.value;
	const currentEnd = els.endNodeSelect.value;

	const startOptions = [{ value: '', label: 'Start Node' }];
	if ((graphRef.nodes || []).length === 0) {
		startOptions.push({ value: 'no-nodes', label: 'No nodes available', disabled: true });
	} else {
		graphRef.nodes.forEach(node => {
			startOptions.push({ value: node.id.toString(), label: node.label || node.id });
		});
	}

	els.startNodeSelect.innerHTML = '';
	startOptions.forEach(opt => {
		const option = document.createElement('option');
		option.value = opt.value;
		option.textContent = opt.label;
		if (opt.disabled) option.disabled = true;
		els.startNodeSelect.appendChild(option);
	});

	if ((graphRef.nodes || []).some(n => n.id.toString() === currentStart)) {
		els.startNodeSelect.value = currentStart;
	}

	const endOptions = [{ value: '', label: 'End Node (optional)' }];
	if ((graphRef.nodes || []).length === 0) {
		endOptions.push({ value: 'no-nodes', label: 'No nodes available', disabled: true });
	} else {
		graphRef.nodes.forEach(node => {
			endOptions.push({ value: node.id.toString(), label: node.label || node.id });
		});
	}

	els.endNodeSelect.innerHTML = '';
	endOptions.forEach(opt => {
		const option = document.createElement('option');
		option.value = opt.value;
		option.textContent = opt.label;
		if (opt.disabled) option.disabled = true;
		els.endNodeSelect.appendChild(option);
	});

	if ((graphRef.nodes || []).some(n => n.id.toString() === currentEnd)) {
		els.endNodeSelect.value = currentEnd;
	}
}
