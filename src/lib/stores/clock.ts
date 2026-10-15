import { readable, derived, type Readable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * The one clock every date/time display reads from.
 *
 * Widgets used to run a timer each (one per weather widget, one per table,
 * a midnight timer in the calendar, an hourly one for the moon). Now there
 * is a single 1s interval, alive only while something subscribes, and two
 * rates are read from it:
 *
 * - `clockSecond` — epoch ms, ticks every second. For clocks with seconds.
 * - `clockMinute` — epoch ms floored to the minute, ticks once a minute, on
 *   the minute. For anything shown at minute precision or coarser (the date,
 *   the moon, a "today" that must roll over at midnight).
 *
 * Pick the slowest rate that still looks right. Timers stall in background
 * tabs and during sleep, so the clock re-reads the time when the tab comes
 * back instead of waiting for the next tick.
 */
export const clockSecond: Readable<number> = readable(Date.now(), (set) => {
	if (!browser) return;
	const tick = () => set(Date.now());
	tick();
	const interval = setInterval(tick, 1000);
	document.addEventListener('visibilitychange', tick);
	window.addEventListener('focus', tick);
	return () => {
		clearInterval(interval);
		document.removeEventListener('visibilitychange', tick);
		window.removeEventListener('focus', tick);
	};
});

const MINUTE_MS = 60_000;

/** Same instant, held until the minute changes (derived stores skip equal values). */
export const clockMinute: Readable<number> = derived(
	clockSecond,
	($ms) => Math.floor($ms / MINUTE_MS) * MINUTE_MS
);
