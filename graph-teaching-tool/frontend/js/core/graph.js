// Minimal Graph: nodes, edges, (de)serialize, localStorage, simple helpers
export class Graph {
	constructor(){
		this.nodes = [];
		this.edges = [];
		this.nextNodeId = 1; 
		this.nextEdgeId = 1; 
		this.isDirected = false; 
	}

	// =============================================================
	// =================== Node CRUD methods =======================
	// =============================================================

	nodeById(id){ return this.nodes.find(node=>node.id===id); }

	addNode(x,y){
		if (this.nodes.length >= 20) throw new Error('Maximum nodes reached');
		const id = this.nextNodeId++; 
		const label = String(id); 
		const node = { id, label, x, y, visited:false, current:false };
		this.nodes.push(node);
		this.saveToLocalStorage();
		return node;
	}

	getNodeAt(x,y, radius=20){
		// Check nodes in reverse order (topmost first)
		for (let i=this.nodes.length-1;i>=0;i--){
			const node = this.nodes[i];
			const dx = node.x - x;
			const dy = node.y - y;
			if (dx*dx + dy*dy <= radius*radius) return node;
		}
		return null;
	}

	moveNode(nodeId, x, y){
		const node = this.nodeById(nodeId);
		if (!node) return;
		node.x = x; 
		node.y = y; 
		this.saveToLocalStorage();
	}

	updateNodeLabel(nodeId, newLabel){
		const node = this.nodeById(nodeId);
		if (!node) return;
		node.label = newLabel;
		this.saveToLocalStorage();
	}

	deleteNode(nodeId){
		const index = this.nodes.findIndex(node => node.id === nodeId);
		if (index < 0) return { success: false, edgeCount: 0 };
		// Count and delete all connected edges
		const connectedEdges = this.edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
		const edgeCount = connectedEdges.length;
		this.edges = this.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);
		// Delete the node
		this.nodes.splice(index, 1);
		this.saveToLocalStorage();
		return { success: true, edgeCount };
	}

	// =============================================================
	// =================== Edge CRUD methods =======================
	// =============================================================

	edgeById(id){ return this.edges.find(edge => edge.id === id); }

	addEdge(source, target, weight=1, isDirected=false){
		if (this.edges.some(e => e.source === source && e.target === target)) {
        	throw new Error('Edge already exists');
    	}
		const id = `e${this.nextEdgeId++}`;
		const edge = { id, source, target, weight, isDirected, traversed:false };
		this.edges.push(edge);
		this.saveToLocalStorage();
		return edge;
	}
	
	getEdgeAt(x, y, tolerance=10){
		for (let edge of this.edges) {
			const sourceNode = this.nodeById(edge.source);
			const targetNode = this.nodeById(edge.target);
			if (!sourceNode || !targetNode) continue; 
			// if distance from point to line segment within tolerance, return edge
			const dist = this.pointToLineSegmentDistance(x, y, sourceNode.x, sourceNode.y, targetNode.x, targetNode.y);
			if (dist <= tolerance) return edge;
		}
		return null;
	}

	pointToLineSegmentDistance(pointX, pointY, sourceX, sourceY, targetX, targetY){
		// relative length of line segment
		const dx = targetX - sourceX;
		const dy = targetY - sourceY;
		// squared length of line segment for normalization
		const lengthSquared = dx*dx + dy*dy;
		// handle zero-length segment (user drags target node on top of source)
		if (lengthSquared === 0) return Math.hypot(pointX - sourceX, pointY - sourceY);
		//  squared relative length of distance between source and point
		//  over length of segment (0 to 1) 
		let projection = ((pointX - sourceX) * dx + (pointY - sourceY) * dy) / lengthSquared;
		// clamp to [0,1] if point outside segment
		projection = Math.max(0, Math.min(1, projection));
		// coordinates of closest point on segment
		const closestX = sourceX + projection * dx; 
		const closestY = sourceY + projection * dy;
		// return distance from point to closest point
		return Math.hypot(pointX - closestX, pointY - closestY);
	}

	updateEdgeWeight(edgeId, newWeight){
		const edge = this.edgeById(edgeId);
		if (!edge) return;
		edge.weight = newWeight;
		this.saveToLocalStorage();
		
	}

	flipEdgeDirection(edgeId){
		const edge = this.edgeById(edgeId);
		if (!edge) return;
		[edge.source, edge.target] = [edge.target, edge.source];
		this.saveToLocalStorage();
		
	}

	setGlobalDirected(isDirected){
		this.isDirected = isDirected;
		this.edges.forEach(edge => edge.isDirected = isDirected);
		this.saveToLocalStorage();
	}

	deleteEdge(edgeId){
		const index = this.edges.findIndex(edge => edge.id === edgeId);
		if (index < 0) return;
		this.edges.splice(index, 1);
		this.saveToLocalStorage();
	}

	// =============================================================
	// =================== Upload/Download =========================
	// =============================================================
	
	serialize(){ return { nodes:this.nodes, edges:this.edges, isDirected:this.isDirected, nextNodeId:this.nextNodeId, nextEdgeId:this.nextEdgeId }; }

	replaceWith(other){
		this.nodes = other.nodes;
		this.edges = other.edges;
		this.isDirected = other.isDirected||false;
		this.nextNodeId = other.nextNodeId||1;
		this.nextEdgeId = other.nextEdgeId||((this.edges?.length||0)+1);
	}

	// Local Storage
	saveToLocalStorage(){ localStorage.setItem('graph_v1', JSON.stringify(this.serialize())); }

	static loadFromLocalStorage(){
		try{
			const s = localStorage.getItem('graph_v1');
			if (!s) return null;
			const obj = JSON.parse(s);
			const g = new Graph();
			g.nodes = obj.nodes||[];
			g.edges = obj.edges||[];
			g.isDirected = obj.isDirected||false;
			g.nextNodeId = obj.nextNodeId||1;
			g.nextEdgeId = obj.nextEdgeId||((g.edges?.length||0)+1);
			return g;
		}catch(e){ return null; }
	}

	// File Download/Upload
	download(){
		// Get the title from localStorage, fallback to 'graph'
		const title = localStorage.getItem('graphTitle') || 'graph';
		const sanitized = title.replace(/[\/\\:*?"<>|]/g, '_').replace(/\s+/g, '_');
		const filename = `${sanitized}.json`;
		
		const data = JSON.stringify(this.serialize(), null, 2);
		const blob = new Blob([data], {type:'application/json'});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a'); 
		a.href = url; 
		a.download = filename; 
		a.click(); 
		URL.revokeObjectURL(url);
	}

	static upload(file){
		return new Promise((resolve, reject)=>{
			const r = new FileReader();
			r.onload = () => {
				try{
					const obj = JSON.parse(r.result);
					const g = new Graph();
					g.nodes = obj.nodes||[];
					g.edges = obj.edges||[];
					g.isDirected = obj.isDirected||false;
					g.nextNodeId = obj.nextNodeId||1;
					g.nextEdgeId = obj.nextEdgeId||((g.edges?.length||0)+1);
					
					// Extract filename without extension and set as title
					const filename = file.name.replace(/\.[^.]*$/, ''); // Remove extension
					localStorage.setItem('graphTitle', filename);
					
					resolve(g);
				}catch(e){ reject(e); }
			};
			r.onerror = reject;
			r.readAsText(file);
		});
	}

	
}
