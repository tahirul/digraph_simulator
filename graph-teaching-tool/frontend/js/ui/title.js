const STORAGE_KEY = 'graphTitle';
const DEFAULT_TITLE = 'Untitled Graph';

function applyTitle(titleEl, nextTitle){
	const normalized = (nextTitle || '').trim() || DEFAULT_TITLE;
	if (titleEl) {
		titleEl.textContent = normalized;
	}
	localStorage.setItem(STORAGE_KEY, normalized);
	return normalized;
}

export function initTitleEdit(titleEl){
	if (!titleEl) return;
	const saved = localStorage.getItem(STORAGE_KEY);
	applyTitle(titleEl, saved || titleEl.textContent || DEFAULT_TITLE);

	titleEl.addEventListener('blur', () => {
		const text = titleEl.textContent.trim();
		if (text) {
			applyTitle(titleEl, text);
		} else {
			const fallback = localStorage.getItem(STORAGE_KEY) || DEFAULT_TITLE;
			applyTitle(titleEl, fallback);
		}
	});

	titleEl.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			const text = titleEl.textContent.trim();
			if (text) {
				applyTitle(titleEl, text);
				titleEl.blur();
			}
		}
	});
}

export function getTitle(titleEl){
	const text = titleEl?.textContent?.trim();
	if (text) return text;
	return localStorage.getItem(STORAGE_KEY) || DEFAULT_TITLE;
}

export function setTitle(titleEl, title){
	return applyTitle(titleEl, title);
}

export function resetTitle(titleEl){
	return applyTitle(titleEl, DEFAULT_TITLE);
}
