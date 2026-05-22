// io/files.js
import { Graph } from '../core/graph.js';
import { getTitle } from '../ui/title.js';

export function initFileIO({ graph, downloadButton, uploadButton, fileInput, onUploadSuccess }) {
	// Download
	downloadButton.addEventListener('click', () => {
		const title = getTitle() || 'graph';
		const sanitized = title.replace(/[\/\\:*?"<>|]/g, '_').replace(/\s+/g, '_');
		const filename = `${sanitized}.json`;
		
		const data = JSON.stringify(graph.serialize(), null, 2);
		const blob = new Blob([data], {type:'application/json'});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a'); 
		a.href = url; 
		a.download = filename; 
		a.click(); 
		URL.revokeObjectURL(url);
	});

	// Upload
	uploadButton.addEventListener('click', () => {
		fileInput?.click();
	});

	fileInput.addEventListener('change', event => {
		const file = event.target.files[0];
		if (!file) return;
		Graph.upload(file)
			.then(loadedGraph => {
				const filename = file.name.replace(/\.[^.]*$/, '');
				onUploadSuccess(loadedGraph, filename);
			})
			.catch(() => {
				if (onUploadSuccess.onError) {
					onUploadSuccess.onError();
				}
			});
	});
}
