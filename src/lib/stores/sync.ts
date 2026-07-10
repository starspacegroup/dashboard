import { browser } from '$app/environment';
import { widgets, sections } from '$lib/stores/widgets';
import { analyticsConnection } from '$lib/stores/analyticsConnection';
import { cloudflareConnection } from '$lib/stores/cloudflareConnection';

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
	'dashboard-analytics-connection',
	'dashboard-cloudflare-connection'
] as const;

const LOCAL_META_KEY = 'dashboard-sync-updated-at';
const LOCAL_USER_KEY = 'dashboard-sync-user';
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
			// A key ABSENT from the remote snapshot means that snapshot predates
			// the key (saved before it was added to SYNCED_KEYS) — NOT a delete.
			// Skip it so a stale blob can't wipe a value only newer clients know
			// about (e.g. a freshly connected Cloudflare/Analytics token). An
			// explicit null (present but cleared) still deletes.
			if (!(key in state)) continue;
			const value = state[key];
			if (value === null) {
				localStorage.removeItem(key);
			} else {
				localStorage.setItem(key, value);
			}
		}

		// Reload stores that cache localStorage state in memory
		sections.load();
		widgets.load();
		analyticsConnection.reload();
		cloudflareConnection.reload();

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

/**
 * Wipe all locally cached dashboard state. Called when a different user
 * signs in on this browser so widget layouts, locations, and the analytics
 * connection never bleed between accounts (locally or up into their KV).
 */
function clearLocalState() {
	for (const key of SYNCED_KEYS) {
		localStorage.removeItem(key);
	}
	localStorage.removeItem(LOCAL_META_KEY);

	// Per-widget weather caches hold the previous user's locations
	const stale: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key && key.startsWith('dashboard-weather-data')) stale.push(key);
	}
	stale.forEach((k) => localStorage.removeItem(k));

	sections.load();
	widgets.load();
	analyticsConnection.reload();
	cloudflareConnection.reload();
}

/**
 * Start the sync engine. Call once from the dashboard page on mount,
 * passing a stable id for the signed-in user (login or email).
 */
export function startSync(currentUserId: string): () => void {
	if (!browser || started) return () => {};
	started = true;

	// Local state belongs to whoever synced it last. A different account
	// signing in starts from a clean slate, then pulls their own state.
	if (currentUserId) {
		const lastUser = localStorage.getItem(LOCAL_USER_KEY);
		if (lastUser && lastUser !== currentUserId) {
			clearLocalState();
		}
		localStorage.setItem(LOCAL_USER_KEY, currentUserId);
	}

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
