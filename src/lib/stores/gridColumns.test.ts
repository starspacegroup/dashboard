import { describe, it, expect } from 'vitest';
import { calculateSectionRows, scaleSectionsToColumns } from './widgets';

const sec = (id: number, gridColumn: number, gridColumnSpan: number) => ({
	id,
	gridColumn,
	gridColumnSpan,
	gridRow: 1
});

describe('scaleSectionsToColumns', () => {
	it('keeps each section its share of the width', () => {
		const halves = [sec(0, 1, 2), sec(1, 3, 2)];
		expect(scaleSectionsToColumns(halves, 4, 6)).toMatchObject([
			{ gridColumn: 1, gridColumnSpan: 3 },
			{ gridColumn: 4, gridColumnSpan: 3 }
		]);
		expect(scaleSectionsToColumns(halves, 4, 2)).toMatchObject([
			{ gridColumn: 1, gridColumnSpan: 1 },
			{ gridColumn: 2, gridColumnSpan: 1 }
		]);
	});

	it('never shrinks a section to nothing or past the edge', () => {
		const quarters = [sec(0, 1, 1), sec(1, 2, 1), sec(2, 3, 1), sec(3, 4, 1)];
		for (const s of scaleSectionsToColumns(quarters, 4, 3)) {
			expect(s.gridColumnSpan).toBeGreaterThanOrEqual(1);
			expect(s.gridColumn + s.gridColumnSpan - 1).toBeLessThanOrEqual(3);
		}
		expect(scaleSectionsToColumns(quarters, 4, 1).every((s) => s.gridColumn === 1)).toBe(true);
	});
});

describe('calculateSectionRows with a column count', () => {
	it('places sections in columns 5 and 6 of a six-column grid', () => {
		const packed = calculateSectionRows([sec(0, 1, 4), sec(1, 5, 1), sec(2, 6, 1)], 6);
		expect(packed.map((s) => [s.gridColumn, s.gridRow])).toEqual([
			[1, 1],
			[5, 1],
			[6, 1]
		]);
	});

	it('stacks sections that share a column after narrowing', () => {
		const packed = calculateSectionRows(
			scaleSectionsToColumns([sec(0, 1, 1), sec(1, 2, 1), sec(2, 3, 1), sec(3, 4, 1)], 4, 2),
			2
		);
		const cells = packed.map((s) => `${s.gridColumn}:${s.gridRow}`);
		expect(new Set(cells).size).toBe(cells.length);
	});
});
