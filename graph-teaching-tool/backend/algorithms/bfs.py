# Breadth First Search implementation with step tracking
from collections import deque


def bfs(graph, start, end=None):
	"""
	Breadth First Search with step-by-step tracking.
	
	Args:
		graph: NetworkX graph object
		start: Start node ID
		end: Optional end/target node ID. If provided, search stops when found.
	
	Returns:
		List of step dictionaries containing:
			- step_number: Step counter
			- current: Current node being visited
			- visited: List of all visited nodes so far
			- queue: Current BFS queue
			- traversedEdges: List of edge IDs traversed in this step
			- pathToEnd: Path from start to end (if end found), None otherwise
			- endNodeFound: Boolean indicating if end node was found
	"""
	visited = set()
	queue = deque([start])
	parent = {start: None}  # Track parent for path reconstruction
	steps = []
	step_no = 0
	end_found = False
	path_to_end = None
	traversed_edges_list = []  # Track all traversed edges for highlighting
	
	while queue:
		current = queue.popleft()
		
		if current in visited:
			continue
		
		visited.add(current)
		
		# Track edges traversed to reach this node (if it has a parent)
		current_step_traversed = []
		if parent[current] is not None:
			# Find edge between parent and current node
			edge_id = _find_edge_id(graph, parent[current], current)
			if edge_id:
				current_step_traversed.append(edge_id)
				traversed_edges_list.append(edge_id)
		
		# Check if we found the end node
		if end is not None and current == end:
			end_found = True
			path_to_end = _reconstruct_path(parent, start, end)
		
		# Enqueue unvisited neighbors
		for nbr in graph.neighbors(current):
			if nbr not in visited and nbr not in [n for n in queue]:
				parent[nbr] = current
				queue.append(nbr)
		
		step_no += 1
		steps.append({
			'step_number': step_no,
			'current': current,
			'visited': list(visited),
			'queue': list(queue),
			'traversedEdges': current_step_traversed,
			'pathToEnd': path_to_end,
			'endNodeFound': end_found
		})
		
		# Stop if end node was found
		if end_found:
			break
	
	# If end node was not found but was requested, add final message
	if end is not None and not end_found:
		steps.append({
			'step_number': step_no + 1,
			'current': None,
			'visited': list(visited),
			'queue': [],
			'traversedEdges': [],
			'pathToEnd': None,
			'endNodeFound': False,
			'message': f'End node {end} could not be found'
		})
	
	return steps


def _find_edge_id(graph, u, v):
	"""Find edge ID between two nodes (handles both directed and undirected)."""
	if graph.has_edge(u, v):
		return graph[u][v].get('id')
	elif graph.has_edge(v, u):
		return graph[v][u].get('id')
	return None


def _reconstruct_path(parent, start, end):
	"""Reconstruct path from start to end using parent pointers."""
	path = []
	current = end
	while current is not None:
		path.append(current)
		current = parent.get(current)
	return list(reversed(path))