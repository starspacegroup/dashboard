import { describe, it, expect } from 'vitest';
import {
	FREE_LIMITS,
	PAID_LIMITS,
	computeMeter,
	limitsFor,
	meterFromDef
} from './limits';

// 2026-07-15 12:00 UTC — half way through the day, mid-month.
const NOON = Date.UTC(2026, 6, 15, 12, 0, 0);

describe('limitsFor', () => {
	it('returns the free table by default and the paid table for paid', () => {
		expect(limitsFor('free')).toBe(FREE_LIMITS);
		expect(limitsFor('paid')).toBe(PAID_LIMITS);
	});

	it('defines the same products and metrics on both tiers', () => {
		for (const product of Object.keys(FREE_LIMITS) as (keyof typeof FREE_LIMITS)[]) {
			expect(Object.keys(PAID_LIMITS[product]).sort()).toEqual(
				Object.keys(FREE_LIMITS[product]).sort()
			);
		}
	});
});

describe('computeMeter — daily window', () => {
	it('projects end-of-day usage from the run rate', () => {
		const m = computeMeter({ used: 100, limit: 1000, window: 'day', now: NOON });
		expect(m.pct).toBe(10);
		expect(m.projected).toBeCloseTo(200);
		expect(m.projectedPct).toBeCloseTo(20);
		expect(m.willExceed).toBe(false);
		expect(m.etaLabel).toBeNull();
		expect(m.tone).toBe('ok');
	});

	it('names the time of day the limit will be hit', () => {
		// 400 by noon → 800/day; limit 500 is reached at 15:00.
		const m = computeMeter({ used: 400, limit: 500, window: 'day', now: NOON });
		expect(m.willExceed).toBe(true);
		expect(m.etaLabel).toBe('15:00 UTC');
		expect(m.tone).toBe('crit');
	});

	it('says "reached" once usage is at or over the limit', () => {
		const m = computeMeter({ used: 1000, limit: 1000, window: 'day', now: NOON });
		expect(m.willExceed).toBe(true);
		expect(m.etaLabel).toBe('reached');
		expect(m.pct).toBe(100);
		expect(m.tone).toBe('crit');
	});

	it('does not divide by zero at the very start of the window', () => {
		const start = Date.UTC(2026, 6, 15);
		const m = computeMeter({ used: 0, limit: 1000, window: 'day', now: start });
		expect(Number.isFinite(m.projected)).toBe(true);
		expect(m.projected).toBe(0);
		expect(m.willExceed).toBe(false);
	});

	it('warns on projection even when current usage is low', () => {
		// 30% used by noon → 60% projected is ok; 40% → 80% projected is warn.
		expect(computeMeter({ used: 300, limit: 1000, window: 'day', now: NOON }).tone).toBe('ok');
		expect(computeMeter({ used: 400, limit: 1000, window: 'day', now: NOON }).tone).toBe('warn');
		expect(computeMeter({ used: 460, limit: 1000, window: 'day', now: NOON }).tone).toBe('crit');
	});

	it('treats a zero limit as 0% rather than NaN', () => {
		const m = computeMeter({ used: 5, limit: 0, window: 'day', now: NOON });
		expect(m.pct).toBe(0);
		expect(m.projectedPct).toBe(0);
	});

	it('does not report a hit that would land after the window ends', () => {
		const now = Date.UTC(2026, 6, 15, 1, 0, 0);
		const m = computeMeter({ used: 1, limit: 1_000_000, window: 'day', now });
		expect(m.willExceed).toBe(false);
		expect(m.etaLabel).toBeNull();
	});
});

describe('computeMeter — monthly window', () => {
	it('projects over the calendar month and labels the ETA as a date', () => {
		// 15 Jul 12:00 is 14.5 of 31 days in. 500 used → hits 1000 at 29 days in.
		const m = computeMeter({ used: 500, limit: 1000, window: 'month', now: NOON });
		expect(m.projected).toBeCloseTo((500 * 31) / 14.5, 3);
		expect(m.willExceed).toBe(true);
		expect(m.etaLabel).toBe('Jul 30');
	});

	it('respects month length', () => {
		const feb = Date.UTC(2026, 1, 15, 0, 0, 0); // 14 of 28 days
		const m = computeMeter({ used: 10, limit: 1000, window: 'month', now: feb });
		expect(m.projected).toBeCloseTo(20);
	});
});

describe('computeMeter — storage', () => {
	it('has no projection and takes tone from current fill', () => {
		const m = computeMeter({ used: 800, limit: 1000, window: 'storage', unit: 'bytes' });
		expect(m.projected).toBeNull();
		expect(m.projectedPct).toBeNull();
		expect(m.willExceed).toBe(false);
		expect(m.etaLabel).toBeNull();
		expect(m.tone).toBe('warn');
		expect(m.unit).toBe('bytes');
	});

	it('reports "over" at or past the limit', () => {
		const m = computeMeter({ used: 1000, limit: 1000, window: 'storage' });
		expect(m.willExceed).toBe(true);
		expect(m.etaLabel).toBe('over');
		expect(m.tone).toBe('crit');
	});
});

describe('meterFromDef', () => {
	it('carries limit, window and unit from the registry entry', () => {
		const m = meterFromDef(FREE_LIMITS.kv.write, 500, NOON);
		expect(m.limit).toBe(1_000);
		expect(m.window).toBe('day');
		expect(m.unit).toBe('count');
		expect(m.pct).toBe(50);
	});

	it('passes bytes through for storage entries', () => {
		const m = meterFromDef(FREE_LIMITS.kv.storage, 5e8);
		expect(m.unit).toBe('bytes');
		expect(m.pct).toBe(50);
	});
});
