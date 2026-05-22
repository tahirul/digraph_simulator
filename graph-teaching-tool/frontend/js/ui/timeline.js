let statusEl = null;
let statusPillEl = null;
let dragHandleEl = null;

export function initTimeline({ status, statusPill, dragHandle }) {
	statusEl = status;
	statusPillEl = statusPill;
	dragHandleEl = dragHandle;
}

export function appendStatus(message, asListItem = false) {
	if (!message || !statusEl) return;
	const node = document.createElement(asListItem ? 'li' : 'div');
	node.textContent = message;
	if (asListItem) {
		let list = statusEl.querySelector('ul');
		if (!list) {
			list = document.createElement('ul');
			statusEl.appendChild(list);
		}
		list.appendChild(node);
	} else {
		statusEl.appendChild(node);
	}
	statusEl.scrollTop = statusEl.scrollHeight;
}

export function clearStatusLog() {
	if (!statusEl) return;
	statusEl.innerHTML = '';
}

export function initTimelineResize() {
	if (!statusPillEl || !dragHandleEl) return;
	let isResizing = false;
	let startX = 0;
	let startWidth = 0;

	dragHandleEl.addEventListener('mousedown', (e) => {
		isResizing = true;
		startX = e.clientX;
		startWidth = statusPillEl.offsetWidth;
		document.body.style.cursor = 'col-resize';
		e.preventDefault();
	});

	document.addEventListener('mousemove', (e) => {
		if (!isResizing) return;
		const delta = startX - e.clientX;
		const newWidth = startWidth + delta;
		const minWidth = 250;
		const maxWidth = window.innerWidth * 0.6;
		const clampedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
		statusPillEl.style.width = clampedWidth + 'px';
	});

	document.addEventListener('mouseup', () => {
		if (isResizing) {
			isResizing = false;
			document.body.style.cursor = '';
		}
	});
}

export function logAlgorithmStep(step) {
	if (!step) return;
	appendStatus(step, true);
}
