# Graph Teaching Tool MVP

Interactive web application for visualizing and learning graph algorithms through step-by-step animation.

## Description

A client-side focused web app that allows users to create custom graphs and visualize how different algorithms traverse them. Users can place nodes, create weighted/directed edges, and watch algorithms execute step-by-step with play/pause/step controls.

## Features

- Interactive canvas for graph creation (drag nodes, click to connect)
- Real-time graph visualization with node/edge labels
- Step-by-step algorithm animation with playback controls
- Auto-save graphs to browser localStorage
- Export/import graphs as JSON
- Support for multiple traversal and spanning tree algorithms
- Right-click context menus for editing properties
- Color-coded visualization (visited nodes, current node, traversed edges)

## Technology Stack

### Backend
- Flask 3.x
- NetworkX (graph operations and validation)
- Python (unit tests with unittest/pytest)

### Frontend
- Vanilla HTML5/CSS3/JavaScript (ES6+)
- HTML5 Canvas API
- Fetch API for backend communication
- Browser localStorage for persistence

## Project Structure

```
graph-teaching-tool/
├── backend/
│   ├── algorithms/          # Algorithm implementations (DFS, BFS, Dijkstra, Prim's, Kruskal's)
│   ├── app.py              # Flask app initialization
│   ├── config.py           # Configuration
│   ├── routes.py           # API endpoints
│   ├── models.py           # Graph data structures
│   ├── tests.py            # Unit tests
│   └── requirements.txt    # Dependencies
└── frontend/
    ├── index.html          # Main page
    ├── css/style.css       # Styling
    └── js/
        ├── app.js          # Main logic
        ├── canvas.js       # Rendering
        ├── api.js          # Backend calls
        └── graph.js        # Graph state
```

## Installation

1. Clone the repository
2. Install Python 3.x
3. Create a virtual environment: `python -m venv venv`
4. Activate it: `venv\Scripts\activate` (Windows)
5. Install dependencies: `pip install -r graph-teaching-tool/backend/requirements.txt`

## Running the Application

### Backend
```
cd graph-teaching-tool/backend
python app.py
```
Server runs on `http://localhost:5000`

### Frontend
Open `http://localhost:5000` in a web browser.


## Testing

```
cd graph-teaching-tool/backend
python -m pytest tests.py
```
