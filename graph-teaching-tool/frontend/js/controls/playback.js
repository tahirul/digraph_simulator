// controls/playback.js
let canvasAPI = null;
let statusFn = null;
let panelFn = null;
let buttons = {};

export function initPlaybackControls({ canvas, appendStatus, showInputPanel, playPauseButton, rewindButton, stepBackButton, stepForwardButton, stopButton }) {
	canvasAPI = canvas;
	statusFn = appendStatus;
	panelFn = showInputPanel;
	buttons = { playPauseButton, rewindButton, stepBackButton, stepForwardButton, stopButton };

	// Rewind
	buttons.rewindButton.addEventListener('click', () => {
		canvasAPI.rewind();
		buttons.playPauseButton.setAttribute('data-state', 'playing');
		buttons.playPauseButton.textContent = '⏸ Pause';
		updatePlaybackButtonStates();
	});

	// Step Back
	buttons.stepBackButton.addEventListener('click', () => {
		canvasAPI.stepBackward();
		updatePlaybackButtonStates();
	});

	// Stop
	buttons.stopButton.addEventListener('click', () => {
		canvasAPI.stop();
		buttons.playPauseButton.textContent = '▶ Play';
		buttons.playPauseButton.setAttribute('data-state', 'paused');
		statusFn('Playback stopped');
		panelFn();
		updatePlaybackButtonStates();
	});

	// Play/Pause
	buttons.playPauseButton.addEventListener('click', () => {
		const isPlaying = buttons.playPauseButton.getAttribute('data-state') === 'playing';
		if (isPlaying) {
			canvasAPI.pause();
			buttons.playPauseButton.textContent = '▶ Play';
			buttons.playPauseButton.setAttribute('data-state', 'paused');
			statusFn('Paused');
		} else {
			canvasAPI.play();
			buttons.playPauseButton.textContent = '⏸ Pause';
			buttons.playPauseButton.setAttribute('data-state', 'playing');
			statusFn('Playing');
		}
		updatePlaybackButtonStates();
	});

	// Step Forward
	buttons.stepForwardButton.addEventListener('click', () => {
		canvasAPI.stepForward();
		updatePlaybackButtonStates();
	});
}

export function updatePlaybackButtonStates() {
	if (!canvasAPI || !buttons.playPauseButton) return;
	const trace = canvasAPI.getTrace();
	const hasTrace = trace !== null && trace !== undefined;
	const isAtEnd = canvasAPI.getTraceIndex() >= (trace?.length || 0);
	const isAtStart = canvasAPI.getTraceIndex() <= 0;
	const isPlaying = canvasAPI.getIsPlaying();

	buttons.playPauseButton.disabled = !hasTrace;
	buttons.rewindButton.disabled = !hasTrace || isAtStart;
	buttons.stepBackButton.disabled = !hasTrace || isAtStart || isPlaying;
	buttons.stepForwardButton.disabled = !hasTrace || isAtEnd || isPlaying;
	buttons.stopButton.disabled = false; // always enabled
}
