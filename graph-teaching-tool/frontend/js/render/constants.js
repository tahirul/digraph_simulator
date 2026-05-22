// render/constants.js
// Edge rendering tokens
export const EDGE_CURVE_OFFSET = 35; // px perpendicular offset for bidirectional edges
export const EDGE_LINE_WIDTH = 3; // px
export const SELF_LOOP_RADIUS = 30; // px
export const EDGE_WEIGHT_FONT_SIZE = 11; // px
export const ARROW_HEAD_LEN = 16; // px

// Node rendering tokens
export const NODE_BORDER = 'rgba(224,227,231,1)';
export const NODE_MIN_RADIUS = 14; // px
export const NODE_MAX_RADIUS = 40; // px
export const NODE_HOVER_SCALE = 1.1; // 10%

// Node state colors (gradient, shadow)
export const NODE_COLORS = {
	base: { from: 'rgba(96,165,250,0.8)', to: 'rgba(79,138,223,0.8)', shadow: 'rgb(96,165,250)' },
	visited: { from: 'rgba(107,114,128,0.8)', to: 'rgba(75,85,99,0.8)', shadow: 'rgb(107,114,128)' },
	current: { from: 'rgba(255,152,0,0.8)', to: 'rgba(245,124,0,0.8)', shadow: 'rgb(255,152,0)' }
};
