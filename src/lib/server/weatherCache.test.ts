import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	getCacheKey,
	getWeatherFromCache,
	setWeatherCache,
	getWeatherCacheInfo,
	getAstronomicalFromCache,
	setAstronomicalCache,
	getLocationFromCache,
	setLocationCache
} from './weatherCache';

const weather = { temperature: 20 } as Parameters<typeof setWeatherCache>[2];
const astro = { moonPhase: 0.5 } as Parameters<typeof setAstronomicalCache>[3];

describe('weatherCache', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('groups nearby coordinates under one key and accepts strings', () => {
		expect(getCacheKey(40.7128, -74.006)).toBe('40.71,-74.01');
		expect(getCacheKey('40.7128', '-74.006')).toBe(getCacheKey(40.714, -74.0099));
	});

	it('serves weather for 10 minutes, then drops it', () => {
		setWeatherCache(1, 1, weather);
		expect(getWeatherFromCache(1, 1)).toBe(weather);

		vi.advanceTimersByTime(9 * 60 * 1000);
		expect(getWeatherFromCache(1, 1)).toBe(weather);
		expect(getWeatherCacheInfo(1, 1)).toMatchObject({ cached: true, age: 9 * 60 * 1000 });

		vi.advanceTimersByTime(2 * 60 * 1000);
		expect(getWeatherFromCache(1, 1)).toBeNull();
		expect(getWeatherCacheInfo(1, 1)).toBeNull();
	});

	it('keeps location names for 24 hours', () => {
		setLocationCache(2, 2, 'Testville');
		vi.advanceTimersByTime(23 * 60 * 60 * 1000);
		expect(getLocationFromCache(2, 2)).toBe('Testville');
		vi.advanceTimersByTime(2 * 60 * 60 * 1000);
		expect(getLocationFromCache(2, 2)).toBeNull();
	});

	it('expires astronomical data at the end of the UTC day when no timezone is given', () => {
		const date = new Date('2026-01-01T10:00:00Z');
		setAstronomicalCache(3, 3, date, astro);
		expect(getAstronomicalFromCache(3, 3, date)).toBe(astro);

		vi.setSystemTime(new Date('2026-01-01T23:59:00Z'));
		expect(getAstronomicalFromCache(3, 3, date)).toBe(astro);
		vi.setSystemTime(new Date('2026-01-02T00:00:01Z'));
		expect(getAstronomicalFromCache(3, 3, date)).toBeNull();
	});

	it('keys astronomical data by day', () => {
		const day1 = new Date('2026-01-01T10:00:00Z');
		const day2 = new Date('2026-01-02T10:00:00Z');
		setAstronomicalCache(4, 4, day1, astro);
		expect(getAstronomicalFromCache(4, 4, day2)).toBeNull();
	});

	it('evicts the oldest tenth once the cache passes 1000 entries', () => {
		for (let i = 0; i < 1001; i++) {
			vi.advanceTimersByTime(1);
			setWeatherCache(50, i / 100, weather);
		}
		// the 1001st write found 1000 entries: no eviction yet
		expect(getWeatherFromCache(50, 0)).toBe(weather);

		vi.advanceTimersByTime(1);
		setWeatherCache(60, 0, weather); // size 1001 → drop the oldest 100
		expect(getWeatherFromCache(50, 0)).toBeNull();
		expect(getWeatherFromCache(50, 99 / 100)).toBeNull();
		expect(getWeatherFromCache(50, 100 / 100)).toBe(weather);
		expect(getWeatherFromCache(60, 0)).toBe(weather);
	});
});
