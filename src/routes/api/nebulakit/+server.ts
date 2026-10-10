import { json } from '@sveltejs/kit';
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
const FETCH_TIMEOUT = 12_000;
const WINDOWS = [1, 7, 30, 90];

function getCached(key: string): unknown | null {
	const entry = cache.get(key);
	if (!entry) return null;
	if (Date.now() - entry.timestamp < CACHE_DURATION) return entry.data;
	cache.delete(key);
	return null;
}

class ReconnectRequiredError extends Error {
	constructor(msg: string) {
		super(msg);
		this.name = 'ReconnectRequiredError';
	}
}

/** The site origin out of the request body, or null if it isn't one. */
function siteOrigin(raw: unknown): string | null {
	if (typeof raw !== 'string' || !raw.trim()) return null;
	try {
		const u = new URL(raw.trim());
		if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
		return u.origin;
	} catch {
		return null;
	}
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
			signal: controller.signal
		});
	} catch (e) {
		const aborted = e instanceof Error && e.name === 'AbortError';
		throw new Error(aborted ? 'The site did not answer in time.' : `Could not reach ${origin}.`);
	} finally {
		clearTimeout(timer);
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

export const POST: RequestHandler = async ({ url, request }) => {
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
			cache.set(cacheKey, { data: summary, timestamp: Date.now() });
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
