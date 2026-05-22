from flask import Blueprint, request, jsonify
import networkx as nx
from algorithms.bfs import bfs
from algorithms.dfs import dfs


api = Blueprint('api', __name__)


def _build_graph(graph_data):
	nodes = graph_data.get('nodes', [])
	edges = graph_data.get('edges', [])
	# Use isDirected flag if provided, otherwise determine from edges
	is_directed = graph_data.get('isDirected', False) or any(e.get('is_directed') for e in edges)
	G = nx.DiGraph() if is_directed else nx.Graph()
	for n in nodes:
		G.add_node(n['id'], **n)
	for e in edges:
		src = e['source']
		tgt = e['target']
		# store edge id and weight as attributes
		G.add_edge(src, tgt, id=e.get('id'), weight=e.get('weight', 1))
		if not is_directed:
			# undirected graph will have single edge; attributes stored once
			pass
	return G


@api.route('/api/validate', methods=['POST'])
def validate_graph():
	data = request.get_json() or {}
	nodes = data.get('nodes', [])
	edges = data.get('edges', [])
	
	if len(nodes) == 0:
		return jsonify({'valid': False, 'error': 'Graph has no nodes'}), 400
	if len(nodes) > 20:
		return jsonify({'valid': False, 'error': 'Too many nodes (max 20)'}), 400
	if len(edges) > 50:
		return jsonify({'valid': False, 'error': 'Too many edges (max 50)'}), 400

	try:
		G = _build_graph(data)
	except Exception as e:
		print(f"Validation error: {e}")
		return jsonify({'valid': False, 'error': f'Invalid graph format: {str(e)}'}), 400

	# For connectivity, check weak connectivity for directed graphs, connected for undirected
	if isinstance(G, nx.DiGraph):
		if not nx.is_weakly_connected(G):
			return jsonify({'valid': False, 'error': 'Graph is not (weakly) connected'}), 400
	else:
		if not nx.is_connected(G):
			return jsonify({'valid': False, 'error': 'Graph is not connected'}), 400

	return jsonify({'valid': True})


def _edge_id_between(edges_list, u, v):
	# find an edge id in provided edges list matching u->v or v->u
	for e in edges_list:
		if e.get('source') == u and e.get('target') == v:
			return e.get('id')
		if e.get('source') == v and e.get('target') == u:
			return e.get('id')
	return None


@api.route('/api/algorithm', methods=['POST'])
def run_algorithm():
	payload = request.get_json() or {}
	graph_data = payload.get('graph_data') or payload
	algo = payload.get('algorithm_name') or payload.get('algorithm')
	start = payload.get('start_node')
	end = payload.get('end_node')

	if not graph_data:
		return jsonify({'success': False, 'error': 'Missing graph_data'}), 400

	try:
		G = _build_graph(graph_data)
	except Exception as e:
		return jsonify({'success': False, 'error': 'Invalid graph format'}), 400

	# default start node
	if not start:
		nodes = list(G.nodes)
		if not nodes:
			return jsonify({'success': False, 'error': 'Empty graph'}), 400
		start = nodes[0]

	steps = []
	try:
		if algo == 'bfs' or algo == 'BFS':
			steps = bfs(G, start, end)

		elif algo == 'dfs' or algo == 'DFS':
			steps = dfs(G, start, end)

		else:
			return jsonify({'success': False, 'error': 'Unsupported algorithm'}), 400

	except Exception as e:
		return jsonify({'success': False, 'error': 'Algorithm execution error'}), 500

	return jsonify({'success': True, 'total_steps': len(steps), 'steps': steps})


def register_routes(app):
	app.register_blueprint(api)
