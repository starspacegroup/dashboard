import { describe, it, expect } from 'vitest';
import { placeLabel, overlap, type Box } from './labelPlacement';

const bounds = { cx: 100, cy: 50, r: 100 };
const size = { w: 36, h: 14 };

function boxAt(p: { x: number; y: number }): Box {
	return { x: p.x - size.w / 2, y: p.y - size.h / 2, w: size.w, h: size.h };
}

// Small deterministic generator so failures reproduce
function rng(seed: number) {
	return () => {
		seed = (seed * 1664525 + 1013904223) % 4294967296;
		return seed / 4294967296;
	};
}

describe('placeLabel', () => {
	it('goes where it was asked when nothing is in the way', () => {
		const p = placeLabel({ point: { x: 100, y: 50 }, size, prefer: Math.PI / 2, obstacles: [], bounds });
		expect(p.crowded).toBe(false);
		expect(p.y).toBeGreaterThan(50); // below the point
	});

	it('moves off an obstacle sitting on its first choice', () => {
		const blocker: Box = { x: 70, y: 56, w: 60, h: 30 };
		const p = placeLabel({ point: { x: 100, y: 50 }, size, prefer: Math.PI / 2, obstacles: [blocker], bounds });
		expect(p.crowded).toBe(false);
		expect(overlap(boxAt(p), blocker)).toBe(0);
	});

	it('never overlaps an obstacle or leaves the bounds when a clear spot exists', () => {
		const rand = rng(7);
		for (let n = 0; n < 300; n++) {
			const angle = rand() * 2 * Math.PI;
			const radius = rand() * 60;
			const point = { x: 100 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius * 0.5 };
			const obstacles: Box[] = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => ({
				x: 40 + rand() * 120,
				y: rand() * 90,
				w: 20 + rand() * 50,
				h: 10 + rand() * 20
			}));
			const p = placeLabel({ point, size, prefer: rand() * 2 * Math.PI, obstacles, bounds });
			if (p.crowded) continue; // nowhere clear — allowed to be least bad
			const box = boxAt(p);
			for (const o of obstacles) expect(overlap(box, o)).toBe(0);
			for (const [x, y] of [
				[box.x, box.y],
				[box.x + box.w, box.y + box.h]
			]) {
				expect(Math.hypot(x - bounds.cx, y - bounds.cy)).toBeLessThanOrEqual(bounds.r);
			}
		}
	});

	it('reports crowded and still answers when everything is blocked', () => {
		const wall: Box = { x: -100, y: -100, w: 500, h: 400 };
		const p = placeLabel({ point: { x: 100, y: 50 }, size, prefer: 0, obstacles: [wall], bounds });
		expect(p.crowded).toBe(true);
		expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
	});
});
