import { describe, it, expect } from 'vitest';
import {
	DATA_TYPE_SLOT,
	dataTypeColor,
	metricColor,
	metricDataType,
	type DataType
} from './metricColors';

describe('metricColors', () => {
	it('gives every data type its own palette slot', () => {
		const slots = Object.values(DATA_TYPE_SLOT);
		expect(new Set(slots).size).toBe(slots.length);
		for (const slot of slots) expect(slot >= 1 && slot <= 8).toBe(true);
	});

	it('finds the same data type by API id, column key or label', () => {
		expect(metricDataType('screenPageViews')).toBe('views');
		expect(metricDataType('pageViews')).toBe('views');
		expect(metricDataType('Page Views')).toBe('views');
		expect(metricDataType('Bounce Rate')).toBe('problems');
		expect(metricDataType('nonsense')).toBeNull();
	});

	it('colours a metric by its data type, so widgets agree', () => {
		expect(metricColor('sessions')).toBe(dataTypeColor('visits'));
		expect(metricColor('requests')).toBe(dataTypeColor('visits'));
		expect(metricColor('Total Users')).toBe(dataTypeColor('users'));
		expect(dataTypeColor('visits')).toBe('var(--series-1)');
	});

	it('keeps an unknown metric on one stable palette colour', () => {
		const first = metricColor('someNewMetric');
		expect(metricColor('someNewMetric')).toBe(first);
		expect(metricColor('some new metric')).toBe(first);
		expect(first).toMatch(/^var\(--series-[1-8]\)$/);
	});

	it('maps every known metric to a real data type', () => {
		const types = Object.keys(DATA_TYPE_SLOT) as DataType[];
		for (const id of ['sessions', 'bytes', 'conversions', 'newUsers', 'events', 'threats']) {
			expect(types).toContain(metricDataType(id));
		}
	});
});
