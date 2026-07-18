import { writable } from 'svelte/store';

/**
 * Volatile, display-only active-alert state per widget — NOT persisted or synced.
 *
 * Lets a widget's *content* (e.g. WeatherWidget, which knows about NWS alerts)
 * signal its *frame* (`Widget.svelte`, which owns the border and header) without
 * the two being directly connected. Same pattern and same reasoning as
 * `liveTitles`: this ticks with live data, so writing it through persisted
 * widget state would fire `dashboard-state-changed` → a debounced KV write on
 * every refresh. See planning/kv-write-amplification.md.
 *
 * The frame tinting matters most when a widget is *collapsed*: the body is
 * `display: none`, so an in-body alert banner is invisible. The header stays
 * visible, so a severe alert still reads at a glance.
 */

export interface WidgetAlert {
	/** e.g. "Flash Flood Warning" */
	event: string;
	/** Raw NWS severity; may be "Unknown". */
	severity: string;
	/** Total active alerts, so the frame can show "+N more". */
	count: number;
	/** Full NWS headline, used as the header tooltip. */
	headline: string;
}

export const widgetAlerts = writable<Record<string, WidgetAlert>>({});

/**
 * Severity → theme colour. NWS sends "Unknown" for a fair number of products
 * (air quality, some statements), so anything unrecognised lands on the lowest
 * tier rather than falling through to no colour at all.
 */
export function alertColorFor(severity: string): string {
	if (severity === 'Extreme' || severity === 'Severe') return 'var(--alert-severe)';
	if (severity === 'Moderate') return 'var(--alert-moderate)';
	return 'var(--alert-minor)';
}

/** Publish a widget's top alert (no-op if unchanged, to avoid render churn). */
export function setWidgetAlert(id: string, alert: WidgetAlert) {
	widgetAlerts.update((m) => {
		const prev = m[id];
		if (
			prev &&
			prev.event === alert.event &&
			prev.severity === alert.severity &&
			prev.count === alert.count
		) {
			return m;
		}
		return { ...m, [id]: alert };
	});
}

/** Drop a widget's alert — alerts expired, widget destroyed, or location changed. */
export function clearWidgetAlert(id: string) {
	widgetAlerts.update((m) => {
		if (!(id in m)) return m;
		const next = { ...m };
		delete next[id];
		return next;
	});
}
