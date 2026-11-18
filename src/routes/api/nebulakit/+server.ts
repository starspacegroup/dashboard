import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { resolveHost } from '$lib/server/resolveHost';
import type { RequestHandler } from './$types';

/**
 * Server-side proxy for a NebulaKit site's stats API.
 *
 * A NebulaKit site exposes `GET /api/stats/summary` behind an owner-issued
 * stats token (NebulaKit `docs/ADMIN_STATS.md`, "Reading the numbers from
 * outside"). The site sends no CORS headers on purpose, so the browser can't
 * call it — this route does, with the token from the POST body forwarded as a
 * Bearer credential. Nothing is stored server-side beyond a short in-memory
 * response cache; the token itself lives client-side in `nebulakitSites` and
 * rides the dashboard-state sync like the Cloudflare keys.
 *
 * Actions (via ?action=): verify, summary (&days=1|7|30|90).
 *
 * Returns `{ code: 'reconnect_required' }` with 401 when the site rejects the
 * token (revoked or rotated), which flips the widget to its Connect screen —
 * same contract as /api/cloudflare and /api/analytics.
 */

interface CacheEntry {
	data: unknown;
	timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200; // keys carry a user-supplied URL and token, so the map needs a ceiling
const FETCH_TIMEOUT = 12_000;
const WINDOWS = [1, 7, 30, 90];

function getCached(key: string): unknown | null {
	const entry = cache.get(key);
	if (!entry) return null;
	if (Date.now() - entry.timestamp < CACHE_DURATION) return entry.data;
	cache.delete(key);
	return null;
}

function setCache(key: string, data: unknown) {
	if (cache.size >= MAX_CACHE_ENTRIES && !cache.has(key)) {
		// Map iterates in insertion order, so the first key is the oldest write.
		const oldest = cache.keys().next().value;
		if (oldest !== undefined) cache.delete(oldest);
	}
	cache.set(key, { data, timestamp: Date.now() });
}

class ReconnectRequiredError extends Error {
	constructor(msg: string) {
		super(msg);
		this.name = 'ReconnectRequiredError';
	}
}

/**
 * True for a host this server must never fetch for a user: loopback, private,
 * link-local, unspecified and cloud-metadata addresses. `new URL` has already
 * turned decimal/hex/octal IPv4 spellings into dotted form and lower-cased the
 * name, so this compares the normalised hostname.
 */
function isBlockedHost(hostname: string): boolean {
	let h = hostname.toLowerCase();
	if (h.startsWith('[') && h.endsWith(']')) h = h.slice(1, -1);
	if (h.endsWith('.')) h = h.slice(0, -1);

	if (h === 'localhost' || h.endsWith('.localhost')) return true;
	if (h === 'metadata.google.internal' || h === 'metadata' || h.endsWith('.internal')) return true;

	const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
	if (v4) {
		const [a, b] = [Number(v4[1]), Number(v4[2])];
		return (
			a === 0 || // unspecified / "this network"
			a === 10 || // private
			a === 127 || // loopback
			(a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
			(a === 169 && b === 254) || // link-local, incl. 169.254.169.254 metadata
			(a === 172 && b >= 16 && b <= 31) || // private
			(a === 192 && b === 168) || // private
			(a === 192 && b === 0) || // protocol assignments
			(a === 198 && (b === 18 || b === 19)) // benchmarking
		);
	}

	if (h.includes(':')) {
		if (h === '::' || h === '::1') return true;
		// IPv4-mapped (::ffff:a.b.c.d, or the hex form URL produces): judge the embedded v4.
		const mapped = h.match(/^(?:0*:){0,5}:?ffff:(.+)$/);
		if (mapped) {
			const tail = mapped[1];
			if (tail.includes('.')) return isBlockedHost(tail);
			const parts = tail.split(':').map((p) => parseInt(p, 16));
			if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
				const [hi, lo] = parts;
				return isBlockedHost(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
			}
			return true;
		}
		const first = parseInt(h.split(':')[0] || '0', 16);
		return (
			(first & 0xfe00) === 0xfc00 || // fc00::/7 unique local (incl. AWS fd00:ec2::254)
			(first & 0xffc0) === 0xfe80 // fe80::/10 link-local
		);
	}
	return false;
}

/** The site origin out of the request body, or null if it isn't one. */
function siteOrigin(raw: unknown): string | null {
	if (typeof raw !== 'string' || !raw.trim()) return null;
	try {
		const u = new URL(raw.trim());
		if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
		// `npm run dev` may point at a site on this machine; a deployed build may not.
		if (isBlockedHost(u.hostname) && !(dev && isLocalhost(u.hostname))) return null;
		return u.origin;
	} catch {
		return null;
	}
}

/** Loopback only — dev's allowance does not extend to private LAN or metadata addresses. */
function isLocalhost(hostname: string): boolean {
	const h = hostname.toLowerCase();
	return h === 'localhost' || h.endsWith('.localhost') || h === '127.0.0.1' || h === '[::1]';
}

/**
 * Check what a hostname points at. A public-looking name can resolve to a
 * private address, so every resolved address is judged and one bad one refuses
 * the lot. IP literals were already judged by `siteOrigin`; dev's localhost
 * allowance is kept. Returns a plain reason when the site must not be fetched.
 */
async function refuseByResolution(origin: string): Promise<string | null> {
	const hostname = new URL(origin).hostname;
	const h = hostname.startsWith('[') ? hostname : hostname.toLowerCase();
	if (h.startsWith('[') || /^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return null;
	if (dev && isLocalhost(h)) return null;

	let addresses: string[];
	try {
		addresses = await resolveHost(h);
	} catch {
		return `Could not look up ${h}.`;
	}
	if (addresses.length === 0) return `${h} did not resolve to an address.`;
	if (addresses.some((a) => isBlockedHost(a))) {
		return `${h} points at a private or internal address.`;
	}
	return null;
}

function clampDays(raw: string | null): number {
	const n = parseInt(raw || '7', 10);
	return WINDOWS.includes(n) ? n : 7;
}

async function fetchSummary(origin: string, token: string, days: number): Promise<unknown> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
	let res: Response;
	try {
		res = await fetch(`${origin}/api/stats/summary?window=${days}`, {
			headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
			signal: controller.signal,
			// A redirect could carry the token to an address the host check never saw.
			redirect: 'manual'
		});
	} catch (e) {
		const aborted = e instanceof Error && e.name === 'AbortError';
		throw new Error(aborted ? 'The site did not answer in time.' : `Could not reach ${origin}.`);
	} finally {
		clearTimeout(timer);
	}

	if (res.status >= 300 && res.status < 400) {
		throw new Error('The site redirected. Use its final address as the site URL.');
	}

	let body: Record<string, unknown> = {};
	try {
		body = (await res.json()) as Record<string, unknown>;
	} catch {
		// A non-JSON answer: most likely not a NebulaKit site, or a very old one.
		if (res.ok || res.status === 404) {
			throw new Error('That URL does not look like a NebulaKit site with stats enabled.');
		}
	}

	if (res.status === 401 || res.status === 403) {
		throw new ReconnectRequiredError(
			String(body.message || 'The site rejected the stats token. Issue a new one at /admin/analytics.')
		);
	}
	if (res.status === 404) {
		throw new Error(
			'This site has no /api/stats/summary — it predates stats sharing. Update it to a current NebulaKit.'
		);
	}
	if (!res.ok) {
		throw new Error(String(body.message || `The site answered HTTP ${res.status}.`));
	}
	if (!body || typeof body !== 'object' || !('stats' in body)) {
		throw new Error('The site answered, but not with a stats summary.');
	}
	return body;
}

export const POST: RequestHandler = async ({ url, request, locals }) => {
	// Without this the route is an open proxy: anyone could make the server fetch
	// any URL. Plain `error`, no `code` — `reconnect_required` means "bad token".
	const session = await locals.auth();
	if (!session?.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const action = url.searchParams.get('action');
	let body: { url?: unknown; token?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	const origin = siteOrigin(body.url);
	const token = typeof body.token === 'string' ? body.token.trim() : '';
	if (!origin) return json({ error: 'A site URL is required.' }, { status: 400 });
	if (!token) return json({ error: 'A stats token is required.' }, { status: 400 });

	const refusal = await refuseByResolution(origin);
	if (refusal) return json({ error: refusal }, { status: 400 });

	const days = clampDays(url.searchParams.get('days'));
	const skipCache = url.searchParams.get('skipCache') === '1';
	// Scoped by token suffix so two sites (or two tokens) never share an entry.
	const cacheKey = `${origin}|${token.slice(-8)}|${action}|${days}`;

	try {
		if (action === 'verify') {
			const summary = (await fetchSummary(origin, token, 1)) as { site?: unknown };
			return json({ valid: true, site: summary.site ?? null });
		}

		if (action === 'summary') {
			if (!skipCache) {
				const cached = getCached(cacheKey);
				if (cached) return json(cached);
			}
			const summary = await fetchSummary(origin, token, days);
			setCache(cacheKey, summary);
			return json(summary);
		}

		return json({ error: 'Invalid action.' }, { status: 400 });
	} catch (e) {
		if (e instanceof ReconnectRequiredError) {
			return json({ error: e.message, code: 'reconnect_required' }, { status: 401 });
		}
		return json({ error: e instanceof Error ? e.message : 'Request failed.' }, { status: 502 });
	}
};
