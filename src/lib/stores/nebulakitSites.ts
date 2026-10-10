import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Saved NebulaKit sites: a named pool like `cloudflareCredentials`, one entry
 * per site the user owns. Each NebulaKit widget's `config.nebulakit.siteId`
 * picks one, so several widgets can watch several sites.
 *
 * `token` is the stats token the site's owner issued at `/admin/analytics`
 * (NebulaKit `docs/ADMIN_STATS.md`, "Reading the numbers from outside"). It is
 * a standing, read-only credential that never expires, which is what lets the
 * connection follow the user across devices through the sync channel.
 */
const STORAGE_KEY = 'dashboard-nebulakit-sites';

export interface NebulaKitSite {
	id: string;
	label: string;
	/** Origin of the site, no trailing slash — `https://example.com`. */
	url: string;
	token: string;
}

interface SitesState {
	sites: NebulaKitSite[];
}

function makeId(): string {
	if (browser && typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return 'site-' + Math.floor(Math.random() * 1e9).toString(36);
}

/** Reduce whatever the user typed to an origin, or '' if it isn't a URL. */
export function normalizeSiteUrl(input: string): string {
	let raw = input.trim();
	if (!raw) return '';
	if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
	try {
		const u = new URL(raw);
		if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
		return u.origin;
	} catch {
		return '';
	}
}

function loadFromStorage(): SitesState {
	const state: SitesState = { sites: [] };
	if (!browser) return state;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			const parsed = JSON.parse(saved);
			if (Array.isArray(parsed?.sites)) {
				state.sites = parsed.sites.filter(
					(s: unknown): s is NebulaKitSite =>
						!!s &&
						typeof (s as NebulaKitSite).id === 'string' &&
						typeof (s as NebulaKitSite).url === 'string' &&
						typeof (s as NebulaKitSite).token === 'string'
				);
			}
		}
	} catch {
		// ignore — start empty
	}
	return state;
}

function createNebulaKitSitesStore() {
	const { subscribe, set, update } = writable<SitesState>(loadFromStorage());

	function persist(state: SitesState) {
		if (!browser) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		// Same signal every other synced store emits so sync.ts pushes to KV.
		window.dispatchEvent(new CustomEvent('dashboard-state-changed'));
	}

	return {
		subscribe,
		/** Add a site, returning its generated id. */
		add(label: string, url: string, token: string): string {
			const id = makeId();
			const site: NebulaKitSite = { id, label: label.trim() || url, url, token };
			update((state) => {
				const next = { sites: [...state.sites, site] };
				persist(next);
				return next;
			});
			return id;
		},
		update(id: string, patch: Partial<Pick<NebulaKitSite, 'label' | 'url' | 'token'>>) {
			update((state) => {
				const next = {
					sites: state.sites.map((s) =>
						s.id === id
							? {
									...s,
									...(patch.label !== undefined ? { label: patch.label.trim() || s.label } : {}),
									...(patch.url !== undefined ? { url: patch.url } : {}),
									...(patch.token !== undefined ? { token: patch.token } : {})
								}
							: s
					)
				};
				persist(next);
				return next;
			});
		},
		remove(id: string) {
			update((state) => {
				const next = { sites: state.sites.filter((s) => s.id !== id) };
				persist(next);
				return next;
			});
		},
		/** Re-read localStorage (used after a remote sync pull updates it). */
		reload() {
			set(loadFromStorage());
		}
	};
}

export const nebulakitSites = createNebulaKitSitesStore();

export const hasNebulaKitSites = derived(nebulakitSites, ($s) => $s.sites.length > 0);

/**
 * Resolve the site a widget should show.
 * - `siteId === ''` → explicit "none" (widget shows its connect prompt).
 * - `siteId === undefined` → the first saved site, so a fresh widget connects
 *   itself when there is only one site to choose from.
 * - a real id → that site, or the first one if the id was since deleted.
 */
export function resolveSite(sites: NebulaKitSite[], siteId: string | undefined): NebulaKitSite | null {
	if (siteId === '') return null;
	const chosen = siteId ? sites.find((s) => s.id === siteId) : undefined;
	return chosen ?? sites[0] ?? null;
}
