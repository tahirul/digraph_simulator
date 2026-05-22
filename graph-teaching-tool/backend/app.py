from flask import Flask, send_from_directory
from flask_cors import CORS
import routes
import os


def create_app():
	# Point to frontend directory for static files
	frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')
	app = Flask(__name__, static_folder=frontend_dir, static_url_path='')
	CORS(app)
	
	# Serve index.html at root
	@app.route('/')
	def index():
		return send_from_directory(app.static_folder, 'index.html')
	
	routes.register_routes(app)
	return app


if __name__ == '__main__':
	app = create_app()
	app.run(host='0.0.0.0', port=5000, debug=True)