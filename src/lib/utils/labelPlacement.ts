/**
 * Placing a text label next to a point on a chart without it landing on
 * anything else. Pure geometry — the caller measures the DOM and passes boxes in.
 */

export interface Box {
	x: number; // left
	y: number; // top
	w: number;
	h: number;
}

export interface PlaceOptions {
	/** The point the label belongs to. */
	point: { x: number; y: number };
	/** Size of the label's text box. */
	size: { w: number; h: number };
	/** Direction to try first, in radians (SVG space: -π/2 is straight up). */
	prefer: number;
	/** Boxes the label must not touch: other text, readouts, other labels. */
	obstacles: Box[];
	/** The label must sit wholly inside this circle (the globe clips the rest). */
	bounds: { cx: number; cy: number; r: number };
	/** Points along the data line; sitting on it is allowed but not liked. */
	line?: { x: number; y: number }[];
}

export interface Placed {
	/** Centre of the label box. */
	x: number;
	y: number;
	/** True when no candidate was clear and this is the least bad one. */
	crowded: boolean;
}

const PAD = 3;
const DISTANCES = [14, 20, 28, 38, 50];
const ANGLE_STEPS = 24;

export function overlap(a: Box, b: Box): number {
	const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
	const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
	return w > 0 && h > 0 ? w * h : 0;
}

function insideCircle(box: Box, c: PlaceOptions['bounds']): boolean {
	const corners = [
		[box.x, box.y],
		[box.x + box.w, box.y],
		[box.x, box.y + box.h],
		[box.x + box.w, box.y + box.h]
	];
	return corners.every(([px, py]) => Math.hypot(px - c.cx, py - c.cy) <= c.r);
}

/** Smallest turn between two angles, 0..π. */
function angleGap(a: number, b: number): number {
	const d = Math.abs(a - b) % (2 * Math.PI);
	return d > Math.PI ? 2 * Math.PI - d : d;
}

/**
 * Try spots around the point, nearest and most-preferred first, and take the
 * first that touches no obstacle and stays inside the bounds. When every spot
 * is crowded, take the one that overlaps least.
 */
export function placeLabel(opts: PlaceOptions): Placed {
	const { point, size, prefer, obstacles, bounds, line = [] } = opts;
	let best: Placed | null = null;
	let bestScore = Infinity;

	for (const dist of DISTANCES) {
		for (let i = 0; i < ANGLE_STEPS; i++) {
			const angle = prefer + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * ((2 * Math.PI) / ANGLE_STEPS);
			// Distance along the angle to the label's near edge, not its centre
			const reach = dist + Math.abs(Math.cos(angle)) * (size.w / 2) + Math.abs(Math.sin(angle)) * (size.h / 2) - 8;
			const cx = point.x + Math.cos(angle) * reach;
			const cy = point.y + Math.sin(angle) * reach;
			const box: Box = { x: cx - size.w / 2 - PAD, y: cy - size.h / 2 - PAD, w: size.w + 2 * PAD, h: size.h + 2 * PAD };

			const hit = obstacles.reduce((sum, o) => sum + overlap(box, o), 0);
			const outside = insideCircle(box, bounds) ? 0 : 1;
			if (hit === 0 && !outside) {
				const onLine = line.filter(
					(p) => p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h
				).length;
				const score = dist + angleGap(angle, prefer) * 6 + onLine * 4;
				if (score < bestScore) {
					bestScore = score;
					best = { x: cx, y: cy, crowded: false };
				}
			} else if (!best || best.crowded) {
				const score = 1e6 + hit + outside * 5000 + dist;
				if (score < bestScore) {
					bestScore = score;
					best = { x: cx, y: cy, crowded: true };
				}
			}
		}
	}
	return best as Placed;
}
