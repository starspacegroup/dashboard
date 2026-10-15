import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$app/environment', () => ({ browser: true }));

describe('clock', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// vitest runs in node: give the clock the two event targets it listens on
		const target = { addEventListener() {}, removeEventListener() {} };
		vi.stubGlobal('document', target);
		vi.stubGlobal('window', target);
		vi.setSystemTime(new Date('2026-01-01T10:00:50Z'));
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('ticks every second; the minute store only on the minute', async () => {
		const { clockSecond, clockMinute } = await import('./clock');
		const seconds: number[] = [];
		const minutes: number[] = [];
		const u1 = clockSecond.subscribe((v) => seconds.push(v));
		const u2 = clockMinute.subscribe((v) => minutes.push(v));
		vi.advanceTimersByTime(20_000);
		expect(new Set(seconds).size).toBeGreaterThanOrEqual(20);
		// 10:00:50 -> 10:01:10 crosses one minute boundary
		expect(new Set(minutes).size).toBe(2);
		expect(get(clockMinute) % 60_000).toBe(0);
		u1();
		u2();
	});

	it('runs one interval however many readers, and none with no readers', async () => {
		const { clockSecond } = await import('./clock');
		const a = clockSecond.subscribe(() => {});
		const b = clockSecond.subscribe(() => {});
		expect(vi.getTimerCount()).toBe(1);
		a();
		b();
		expect(vi.getTimerCount()).toBe(0);
	});
});
