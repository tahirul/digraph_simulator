// Minimal API wrapper to call the backend endpoints
const base = location.origin;

export async function validateGraph(graph){
	const res = await fetch(`${base}/api/validate`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(graph) });
	return res.ok ? await res.json() : { valid:false, error:'Network error' };
}

export async function runAlgorithm(graph, algorithmName, startNode=null, endNode=null){
	const payload = { graph_data: graph, algorithm_name: algorithmName, start_node: startNode, end_node: endNode };
	const res = await fetch(`${base}/api/algorithm`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
	return res.ok ? await res.json() : { success:false, error:'Network error' };
}
