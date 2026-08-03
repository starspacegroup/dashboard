import { writable } from 'svelte/store';

/**
 * Volatile, display-only widget titles that must NOT be persisted or synced.
 *
 * Widgets that embed live data in their title — crypto price (60s), GA realtime
 * user count (30s), today's date, the connected Cloudflare account, the current
 * temperature — write here instead of `widgets.updateTitle()`. `updateTitle`
 * mutates persisted widget state, which fires `dashboard-state-changed` → a
 * debounced KV write on every tick; on the free tier that alone burned ~65% of
 * the 1,000-writes/day budget from a single open tab. See
 * planning/kv-write-amplification.md.
 *
 * The widget frame renders `$liveTitles[widget.id] ?? widget.title`, so a live
 * title transparently overrides the (now static) persisted one at runtime.
 * `widgets.updateTitle` is reserved for deliberate user renames / real state.
 *
 * A title may be a plain string, or segments so part of it can carry its own
 * colour (the weather widget tints the temperature by how hot it is). Segment
 * colours are any CSS colour expression — prefer theme-aware ones such as
 * `color-mix(in oklab, var(--text-primary), var(--temp-hot) 40%)` over raw hex.
 */
export type LiveTitleSegment = { text: string; color?: string };
export type LiveTitle = string | LiveTitleSegment[];

export const liveTitles = writable<Record<string, LiveTitle>>({});

/** Structural equality, so a re-rendered segment list isn't treated as a change. */
function sameTitle(a: LiveTitle | undefined, b: LiveTitle): boolean {
	if (a === b) return true;
	if (!Array.isArray(a) || !Array.isArray(b)) return false;
	return (
		a.length === b.length &&
		a.every((seg, i) => seg.text === b[i].text && seg.color === b[i].color)
	);
}

/** Set a widget's display-only title (no-op if unchanged, to avoid churn). */
export function setLiveTitle(id: string, title: LiveTitle) {
	liveTitles.update((m) => (sameTitle(m[id], title) ? m : { ...m, [id]: title }));
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
