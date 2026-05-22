// Context menu management for nodes and edges

let contextMenu = null;
let confirmDialog = null;
let activeEdgeId = null;
let activeNodeId = null;

export function hide() {
	if (contextMenu) {
		contextMenu.remove();
		contextMenu = null;
		activeEdgeId = null;
		activeNodeId = null;
	}
	if (confirmDialog) {
		confirmDialog.remove();
		confirmDialog = null;
	}
}

export function showEdgeMenu(edge, x, y, graph) {
	hide();
	activeEdgeId = edge.id;
	
	contextMenu = document.createElement('div');
	contextMenu.className = 'context-menu';
	contextMenu.style.left = `${x}px`;
	contextMenu.style.top = `${y}px`;
	
	// Edit Weight
	const editRow = document.createElement('div');
	editRow.className = 'menu-edit-row';
	
	const label = document.createElement('span');
	label.textContent = 'Weight:';
	label.className = 'menu-label';
	
	const input = document.createElement('div');
	input.contentEditable = 'true';
	input.textContent = String(edge.weight || 1);
	input.className = 'menu-input menu-input-text menu-contenteditable';
	input.style.minWidth = '50px';
	input.addEventListener('blur', () => {
		const trimmed = input.textContent.trim();
		input.textContent = trimmed || String(edge.weight || 1);
	});
	input.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			applyBtn.click();
		}
	});
	
	const applyBtn = document.createElement('button');
	applyBtn.textContent = 'Apply';
	applyBtn.className = 'menu-button menu-apply-button';
	applyBtn.onclick = () => {
		const w = parseInt(input.textContent, 10);
		if (!isNaN(w) && w > 0) {
			graph.updateEdgeWeight(edge.id, w);
			window.statusMessage = `Weight updated to ${w}`;
			hide();
		} else {
			alert('Please enter a positive integer');
		}
	};
	
	editRow.appendChild(label);
	editRow.appendChild(input);
	editRow.appendChild(applyBtn);
	contextMenu.appendChild(editRow);
	
	// Flip Direction
	const flipBtn = document.createElement('div');
	flipBtn.className = 'menu-action-button';
	flipBtn.textContent = '🔄 Flip Direction';
	flipBtn.onclick = () => {
		graph.flipEdgeDirection(edge.id);
		window.statusMessage = 'Edge direction flipped (source ↔ target)';
		hide();
	};
	contextMenu.appendChild(flipBtn);
	
	// Delete Edge
	const deleteBtn = document.createElement('div');
	deleteBtn.className = 'menu-action-button menu-delete-button';
	deleteBtn.textContent = '🗑️ Delete Edge';
	deleteBtn.onclick = () => {
		graph.deleteEdge(edge.id);
		window.statusMessage = 'Edge deleted';
		hide();
	};
	contextMenu.appendChild(deleteBtn);
	
	document.body.appendChild(contextMenu);
	
	// Close on click outside
	const closeOnClickOutside = (e) => {
		if (!contextMenu.contains(e.target)) {
			hide();
			document.removeEventListener('click', closeOnClickOutside);
		}
	};
	setTimeout(() => document.addEventListener('click', closeOnClickOutside), 0);
}

export function showNodeMenu(node, x, y, graph) {
	hide();
	activeNodeId = node.id;
	
	contextMenu = document.createElement('div');
	contextMenu.className = 'context-menu';
	contextMenu.style.left = `${x}px`;
	contextMenu.style.top = `${y}px`;

	// Edit Label
	const editRow = document.createElement('div');
	editRow.className = 'menu-edit-row';
	
	const label = document.createElement('span');
	label.textContent = `Node ${node.id} Label:`;
	label.className = 'menu-label';
	
	const input = document.createElement('div');
	input.contentEditable = 'true';
	input.textContent = node.label || String(node.id);
	input.className = 'menu-input menu-input-text menu-contenteditable';
	input.style.minWidth = '100px';
	input.addEventListener('blur', () => {
		const trimmed = input.textContent.trim();
		if (!trimmed) {
			input.textContent = node.label || String(node.id);
		}
	});
	input.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			applyBtn.click();
		}
	});
	
	const applyBtn = document.createElement('button');
	applyBtn.textContent = 'Apply';
	applyBtn.className = 'menu-button menu-apply-button';
	applyBtn.onclick = () => {
		const newLabel = input.textContent.trim();
		if (newLabel.length === 0) {
			window.statusMessage = 'Error: Label cannot be empty';
			return;
		}
		if (newLabel.length > 15) {
			window.statusMessage = 'Error: Label cannot exceed 15 characters';
			return;
		}
		graph.updateNodeLabel(node.id, newLabel);
		window.statusMessage = 'Node label updated';
		hide();
	};
	
	editRow.appendChild(label);
	editRow.appendChild(input);
	editRow.appendChild(applyBtn);
	contextMenu.appendChild(editRow);

	// append connected in edges with numbered list
	const inEdges = graph.edges.filter(e => e.target === node.id);
	if (inEdges.length > 0) {
		const inEdgeList = document.createElement('div');
		inEdgeList.className = 'menu-row menu-info';
		inEdgeList.textContent = 'In Edges:';
		contextMenu.appendChild(inEdgeList);
		inEdges.forEach((edge, i) => {
			const edgeRow = document.createElement('div');
			edgeRow.className = 'menu-row menu-info';
			// replace node ids with labels if available
			const sourceLabel = graph.nodes.find(n => n.id === edge.source)?.label || edge.source;
			const targetLabel = graph.nodes.find(n => n.id === edge.target)?.label || edge.target;
			edgeRow.textContent = `${i + 1}. ${sourceLabel} → ${targetLabel}`;
			contextMenu.appendChild(edgeRow);
		});
	}
	// append connected out edges with numbered list
	const outEdges = graph.edges.filter(e => e.source === node.id);
	if (outEdges.length > 0) {
		const outEdgeList = document.createElement('div');
		outEdgeList.className = 'menu-row menu-info';
		outEdgeList.textContent = 'Out Edges:';
		contextMenu.appendChild(outEdgeList);
		outEdges.forEach((edge, i) => {
			const edgeRow = document.createElement('div');
			edgeRow.className = 'menu-row menu-info';
			// replace node ids with labels if available
			const sourceLabel = graph.nodes.find(n => n.id === edge.source)?.label || edge.source;
			const targetLabel = graph.nodes.find(n => n.id === edge.target)?.label || edge.target;
			edgeRow.textContent = `${i + 1}. ${sourceLabel} → ${targetLabel}`;
			contextMenu.appendChild(edgeRow);
		});
	}
	
	// Delete Node
	const deleteBtn = document.createElement('div');
	deleteBtn.className = 'menu-action-button menu-delete-button';
	deleteBtn.textContent = '🗑️ Delete Node';
	deleteBtn.onclick = () => {
		const rect = contextMenu.getBoundingClientRect();
		showDeleteDialog(node, rect.left, rect.top, graph);
	};
	contextMenu.appendChild(deleteBtn);
	
	document.body.appendChild(contextMenu);
	
	// Close on click outside
	const closeOnClickOutside = (e) => {
		if (contextMenu && !contextMenu.contains(e.target) && (!confirmDialog || !confirmDialog.contains(e.target))) {
			hide();
			document.removeEventListener('click', closeOnClickOutside);
		}
	};
	setTimeout(() => document.addEventListener('click', closeOnClickOutside), 0);
}

function showDeleteDialog(node, x, y, graph) {
	confirmDialog = document.createElement('div');
	confirmDialog.className = 'confirm-dialog';
	confirmDialog.style.left = `${x}px`;
	confirmDialog.style.top = `${y}px`;
	
	const edgeCount = graph.edges.filter(e => e.source === node.id || e.target === node.id).length;
	
	const msg = document.createElement('div');
	msg.className = 'confirm-message';
	msg.textContent = `Delete node ${node.label}? This will also delete ${edgeCount} connected edge${edgeCount !== 1 ? 's' : ''}.`;
	confirmDialog.appendChild(msg);
	
	const btnRow = document.createElement('div');
	btnRow.className = 'confirm-buttons';
	
	const cancelBtn = document.createElement('button');
	cancelBtn.textContent = 'Cancel';
	cancelBtn.className = 'confirm-cancel';
	cancelBtn.onclick = () => {
		confirmDialog.remove();
		confirmDialog = null;
	};
	
	const confirmBtn = document.createElement('button');
	confirmBtn.textContent = 'Delete';
	confirmBtn.className = 'confirm-delete';
	confirmBtn.onclick = () => {
		confirmDialog.remove();
		confirmDialog = null;
		const result = graph.deleteNode(node.id);
		if (result.success) {
			window.statusMessage = `Node ${node.label} and ${result.edgeCount} edge${result.edgeCount !== 1 ? 's' : ''} deleted`;
			hide();
		}
	};
	
	btnRow.appendChild(cancelBtn);
	btnRow.appendChild(confirmBtn);
	confirmDialog.appendChild(btnRow);
	
	document.body.appendChild(confirmDialog);
}

export function getActiveEdgeId() {
	return activeEdgeId;
}

export function getActiveNodeId() {
	return activeNodeId;
}

export const hideMenu = hide;
