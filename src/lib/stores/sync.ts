import { browser } from '$app/environment';
import { widgets, sections } from '$lib/stores/widgets';
import { analyticsConnection } from '$lib/stores/analyticsConnection';

/**
 * Cross-instance dashboard sync.
 *
 * Snapshots a fixed set of localStorage keys and persists them server-side
 * (Cloudflare KV, keyed by the logged-in user) via /api/dashboard-state.
 * Other instances pull on load, on tab focus, and on a slow interval.
 * Conflicts resolve last-write-wins by timestamp.
 */

const SYNCED_KEYS = [
	'dashboard-widgets',
	'dashboard-sections',
	'dashboard-layout-widgets',
	'dashboard-current-layout',
	'dashboard-location',
	'dashboard-zip-code',
	'dashboard-temp-unit-global',
	'dashboard-analytics-connection'
] as const;

const LOCAL_META_KEY = 'dashboard-sync-updated-at';
const PUSH_DEBOUNCE_MS = 2000;
const PULL_INTERVAL_MS = 60 * 1000;

let started = false;
let syncAvailable = true; // set false on 501 (KV not configured) or 401
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushPending = false;
let applyingRemote = false;

function localUpdatedAt(): number {
	const raw = localStorage.getItem(LOCAL_META_KEY);
	const n = raw ? parseInt(raw, 10) : 0;
	return Number.isFinite(n) ? n : 0;
}

function snapshot(): Record<string, string | null> {
	const state: Record<string, string | null> = {};
	for (const key of SYNCED_KEYS) {
		state[key] = localStorage.getItem(key);
	}
	return state;
}

function applySnapshot(state: Record<string, string | null>) {
	applyingRemote = true;
	try {
		const oldLocation = localStorage.getItem('dashboard-location');

		for (const key of SYNCED_KEYS) {
			const value = state[key];
			if (value === null || value === undefined) {
				localStorage.removeItem(key);
			} else {
				localStorage.setItem(key, value);
			}
		}

		// Reload stores that cache localStorage state in memory
		sections.load();
		widgets.load();
		analyticsConnection.reload();

		// Notify widgets that listen for location changes
		const newLocation = localStorage.getItem('dashboard-location');
		if (newLocation !== oldLocation) {
			if (newLocation) {
				try {
					window.dispatchEvent(
						new CustomEvent('location-changed', { detail: JSON.parse(newLocation) })
					);
				} catch {
					// unparseable location — skip the notification
				}
			} else {
				window.dispatchEvent(new CustomEvent('location-cleared'));
			}
		}
	} finally {
		applyingRemote = false;
	}
}

async function pull() {
	if (!syncAvailable || pushPending) return;
	try {
		const res = await fetch('/api/dashboard-state');
		if (res.status === 501 || res.status === 401) {
			syncAvailable = false;
			return;
		}
		if (!res.ok) return;

		const data = (await res.json()) as {
			state: Record<string, string | null> | null;
			updatedAt: number;
		};

		if (!data.state) {
			// No remote state yet — seed it with what we have locally
			if (localStorage.getItem('dashboard-widgets')) {
				markDirty();
			}
			return;
		}

		if (data.updatedAt > localUpdatedAt()) {
			applySnapshot(data.state);
			localStorage.setItem(LOCAL_META_KEY, String(data.updatedAt));
		}
	} catch {
		// network hiccup — try again next cycle
	}
}

async function push() {
	if (!syncAvailable) return;
	pushPending = false;
	const updatedAt = Date.now();
	try {
		const res = await fetch('/api/dashboard-state', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ state: snapshot(), updatedAt })
		});
		if (res.status === 501 || res.status === 401) {
			syncAvailable = false;
			return;
		}
		if (res.ok) {
			const data = (await res.json()) as { ok: boolean; conflict?: boolean; updatedAt: number };
			if (data.ok) {
				localStorage.setItem(LOCAL_META_KEY, String(updatedAt));
			} else if (data.conflict) {
				// Remote is newer than us — pick it up
				await pull();
			}
		}
	} catch {
		// network hiccup — the next markDirty will retry
	}
}

/**
 * Call after any local change to synced state. Debounced push.
 * Safe to call from stores even when sync isn't running (no-op).
 */
export function markDirty() {
	if (!browser || !started || !syncAvailable || applyingRemote) return;
	pushPending = true;
	if (pushTimer) clearTimeout(pushTimer);
	pushTimer = setTimeout(() => void push(), PUSH_DEBOUNCE_MS);
}

/** Start the sync engine. Call once from the dashboard page on mount. */
export function startSync(): () => void {
	if (!browser || started) return () => {};
	started = true;

	void pull();

	const interval = setInterval(() => {
		if (document.visibilityState === 'visible') void pull();
	}, PULL_INTERVAL_MS);

	const onVisible = () => {
		if (document.visibilityState === 'visible') void pull();
	};
	document.addEventListener('visibilitychange', onVisible);

	// Stores dispatch this after writing synced localStorage keys
	const onChanged = () => markDirty();
	window.addEventListener('dashboard-state-changed', onChanged);

	return () => {
		started = false;
		clearInterval(interval);
		document.removeEventListener('visibilitychange', onVisible);
		window.removeEventListener('dashboard-state-changed', onChanged);
		if (pushTimer) clearTimeout(pushTimer);
	};
}
