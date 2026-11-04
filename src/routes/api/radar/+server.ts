import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const BASE = 'https://api.cloudflare.com/client/v4/radar';
const TIMEOUT_MS = 12_000;
const CACHE_TTL_MS = 5 * 60 * 1000;

// One answer is ever held (the data is global, not per user), so this cannot grow.
let cache: { at: number; body: unknown } | null = null;

async function radar<T>(path: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { success?: boolean; result?: T };
    return body.success === false ? null : (body.result ?? null);
  } catch {
    return null;
  }
}

const pct = (v: string | undefined) => (v === undefined || isNaN(Number(v)) ? null : Number(v));

interface OutagesResult {
  annotations?: {
    description?: string;
    scope?: string;
    startDate?: string;
    endDate?: string | null;
    locations?: string[];
  }[];
}

/**
 * Global internet health from Cloudflare Radar.
 * The token is one server-side value, `CLOUDFLARE_RADAR_TOKEN`, read per
 * request (like /api/maps-config and /api/spotify) so adding it after deploy
 * needs no rebuild. Absent → `{ configured: false }` and nothing goes upstream.
 * Each panel is fetched on its own and fails alone: a failed one comes back null.
 */
export const GET: RequestHandler = async ({ locals }) => {
  const session = await locals.auth();
  if (!session?.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  const token = (env.CLOUDFLARE_RADAR_TOKEN ?? '').trim();
  if (!token) {
    return json({ configured: false });
  }

  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return json(cache.body);
  }

  const [outages, ipVersion, protocol] = await Promise.all([
    radar<OutagesResult>('/annotations/outages?dateRange=1d&limit=5&format=json', token),
    radar<{ summary_0?: { IPv6?: string } }>('/http/summary/ip_version?dateRange=1d&format=json', token),
    radar<{ summary_0?: Record<string, string> }>('/http/summary/http_protocol?dateRange=1d&format=json', token)
  ]);

  if (!outages && !ipVersion && !protocol) {
    return json({ configured: true, error: 'Cloudflare Radar is unavailable' }, { status: 502 });
  }

  const body = {
    configured: true,
    outages: outages
      ? (outages.annotations ?? []).map((a) => ({
          description: a.description ?? a.scope ?? 'Outage',
          locations: a.locations ?? [],
          startDate: a.startDate ?? null,
          ongoing: !a.endDate
        }))
      : null,
    ipv6Share: ipVersion ? pct(ipVersion.summary_0?.IPv6) : null,
    http3Share: protocol ? pct(protocol.summary_0?.['HTTP/3']) : null
  };

  cache = { at: Date.now(), body };
  return json(body);
};
