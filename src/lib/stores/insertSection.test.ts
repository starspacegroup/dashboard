import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { sections, gridColumns } from './widgets';

const cols = () =>
	get(sections)
		.map((s) => [s.id, s.gridColumn])
		.sort((a, b) => a[1] - b[1]);

describe('sections.insertSection', () => {
	beforeEach(() => {
		gridColumns.set(4);
		sections.applyLayout([
			{ gridColumn: 1, gridColumnSpan: 1, gridRow: 1 },
			{ gridColumn: 2, gridColumnSpan: 1, gridRow: 1 },
			{ gridColumn: 3, gridColumnSpan: 1, gridRow: 1 },
			{ gridColumn: 4, gridColumnSpan: 1, gridRow: 1 }
		]);
	});

	it('moves the last column to the first slot', () => {
		sections.insertSection(3, 1);
		expect(cols()).toEqual([[3, 1], [0, 2], [1, 3], [2, 4]]);
	});

	it('moves the first column to the last slot', () => {
		sections.insertSection(0, 5);
		expect(cols()).toEqual([[1, 1], [2, 2], [3, 3], [0, 4]]);
	});

	it('moves a column between two others', () => {
		sections.insertSection(0, 3);
		expect(cols()).toEqual([[1, 1], [0, 2], [2, 3], [3, 4]]);
	});

	it('ignores a drop beside itself', () => {
		sections.insertSection(1, 2);
		sections.insertSection(1, 3);
		expect(cols()).toEqual([[0, 1], [1, 2], [2, 3], [3, 4]]);
	});
});
