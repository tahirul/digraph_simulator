import json
import pytest
from app import create_app


@pytest.fixture
def client():
	app = create_app()
	app.testing = True
	with app.test_client() as client:
		yield client


def sample_graph():
	return {
		'nodes': [ {'id':'A'}, {'id':'B'}, {'id':'C'} ],
		'edges': [ {'id':'e1','source':'A','target':'B'}, {'id':'e2','source':'B','target':'C'} ]
	}


def test_validate_ok(client):
	res = client.post('/api/validate', json=sample_graph())
	assert res.status_code == 200
	data = res.get_json()
	assert data.get('valid') is True


def test_bfs_trace(client):
	payload = {'graph_data': sample_graph(), 'algorithm_name': 'bfs', 'start_node': 'A'}
	res = client.post('/api/algorithm', json=payload)
	assert res.status_code == 200
	data = res.get_json()
	assert data.get('success') is True
	assert data.get('total_steps') >= 1
