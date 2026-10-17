import { describe, it, expect } from 'vitest';
import { pickInitialTheme } from './theme';

describe('pickInitialTheme', () => {
	it('keeps an explicit "system" choice across reloads', () => {
		expect(pickInitialTheme('auto', 'true', true)).toBe('auto');
	});

	it('keeps an explicit light or dark choice', () => {
		expect(pickInitialTheme('light', 'true', true)).toBe('light');
		expect(pickInitialTheme('dark', 'true', false)).toBe('dark');
	});

	it('follows the system when nothing was ever chosen', () => {
		expect(pickInitialTheme(null, null, true)).toBe('auto');
	});

	it('falls back to dark with no choice and no system preference', () => {
		expect(pickInitialTheme(null, null, false)).toBe('dark');
		expect(pickInitialTheme('bogus', 'true', true)).toBe('dark');
	});
});
