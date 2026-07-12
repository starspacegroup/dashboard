import { writable } from 'svelte/store';

/**
 * Volatile, display-only widget titles that must NOT be persisted or synced.
 *
 * Widgets that embed live data in their title — crypto price (60s), GA realtime
 * user count (30s), today's date, the connected Cloudflare account — write here
 * instead of `widgets.updateTitle()`. `updateTitle` mutates persisted widget
 * state, which fires `dashboard-state-changed` → a debounced KV write on every
 * tick; on the free tier that alone burned ~65% of the 1,000-writes/day budget
 * from a single open tab. See planning/kv-write-amplification.md.
 *
 * The widget frame renders `$liveTitles[widget.id] ?? widget.title`, so a live
 * title transparently overrides the (now static) persisted one at runtime.
 * `widgets.updateTitle` is reserved for deliberate user renames / real state.
 */
export const liveTitles = writable<Record<string, string>>({});

/** Set a widget's display-only title (no-op if unchanged, to avoid churn). */
export function setLiveTitle(id: string, title: string) {
	liveTitles.update((m) => (m[id] === title ? m : { ...m, [id]: title }));
}

/** Drop a widget's live title (e.g. on disconnect), falling back to widget.title. */
export function clearLiveTitle(id: string) {
	liveTitles.update((m) => {
		if (!(id in m)) return m;
		const next = { ...m };
		delete next[id];
		return next;
	});
}
