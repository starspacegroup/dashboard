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
	/** Full NWS headline — the actual detail, shown in the tap-out panel. */
	headline: string;
	/**
	 * Pre-formatted end time ("9:00 PM"), or '' when the alert has no end.
	 * Formatted by the publisher because it knows the widget's timezone; the
	 * frame just renders the string.
	 */
	endsText: string;
}

/**
 * Every active alert for the widget, most severe first — not just the top one.
 * The header shows the first and a +N count; tapping it opens the full list,
 * which is the only way to read alerts 2..N (and the only way to see any
 * detail at all on touch, where `title` tooltips don't exist).
 */
export const widgetAlerts = writable<Record<string, WidgetAlert[]>>({});

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

/** Publish a widget's active alerts (no-op if unchanged, to avoid render churn). */
export function setWidgetAlerts(id: string, alerts: WidgetAlert[]) {
	widgetAlerts.update((m) => {
		const prev = m[id];
		if (
			prev &&
			prev.length === alerts.length &&
			prev.every(
				(p, i) =>
					p.event === alerts[i].event &&
					p.severity === alerts[i].severity &&
					p.endsText === alerts[i].endsText
			)
		) {
			return m;
		}
		return { ...m, [id]: alerts };
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
