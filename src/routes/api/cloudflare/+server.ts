import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Server-side proxy for the Cloudflare API.
 *
 * The dashboard never registers an OAuth app with Cloudflare — instead the user
 * pastes a scoped, long-lived API token (created in their Cloudflare dashboard).
 * The token is passed in the POST body and forwarded as a Bearer credential.
 * Nothing is stored server-side beyond a short-lived in-memory response cache;
 * the token itself lives client-side and is synced via /api/dashboard-state.
 *
 * Usage numbers are returned as raw "current window" values (today for daily
 * limits, month-to-date for monthly limits, a snapshot for storage). The client
 * turns these into meters against plan limits via src/lib/cloudflare/limits.ts —
 * so the free/paid toggle stays client-side with no server round-trip.
 *
 * Actions (via ?action=): verify, accounts, overview, zones, zone-analytics,
 * pages, workers, kv, r2, d1, queues, security, web-analytics, durable-objects.
 */

const CF_API = 'https://api.cloudflare.com/client/v4';
const CF_GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql';

// ─── Response cache (per token + action) ──────────────────────────
interface CacheEntry {
  data: unknown;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp < CACHE_DURATION) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

/** Thrown when the token is invalid/revoked and the user must reconnect. */
class ReconnectRequiredError extends Error {
  constructor(msg = 'Cloudflare token is invalid or expired. Reconnect to continue.') {
    super(msg);
    this.name = 'ReconnectRequiredError';
  }
}

// ─── Low-level Cloudflare fetch helpers ───────────────────────────

interface CfEnvelope<T> {
  success: boolean;
  result: T;
  errors?: { code: number; message: string }[];
  result_info?: { total_count?: number };
}

async function cfFetch<T>(token: string, path: string): Promise<CfEnvelope<T>> {
  const res = await fetch(`${CF_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (res.status === 401 || res.status === 403) {
    throw new ReconnectRequiredError();
  }

  const body = (await res.json()) as CfEnvelope<T>;
  if (!body.success) {
    const first = body.errors?.[0];
    // 1000/9109 = auth problems; treat as needing reconnect
    if (first && (first.code === 1000 || first.code === 9109 || first.code === 10000)) {
      throw new ReconnectRequiredError(first.message);
    }
    throw new Error(first?.message || `Cloudflare API error (HTTP ${res.status})`);
  }
  return body;
}

interface GraphQLResult<T> {
  data: T | null;
  errors?: { message: string }[];
}

async function cfGraphQL<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(CF_GRAPHQL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  if (res.status === 401 || res.status === 403) {
    throw new ReconnectRequiredError();
  }

  const body = (await res.json()) as GraphQLResult<T>;
  if (body.errors && body.errors.length > 0) {
    const msg = body.errors[0].message;
    if (/authentic|permission|forbidden|not authorized/i.test(msg)) {
      throw new Error(`Analytics permission missing on token: ${msg}`);
    }
    throw new Error(msg);
  }
  if (!body.data) throw new Error('Cloudflare returned no analytics data.');
  return body.data;
}

// ─── Date helpers ─────────────────────────────────────────────────

function clampDays(raw: string | null): number {
  const n = parseInt(raw || '7', 10);
  if (![1, 7, 14, 30].includes(n)) return 7;
  return n;
}

/** YYYY-MM-DD for `daysAgo` days before today (UTC). day 0 = today */
function isoDate(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

/** Full ISO timestamp `daysAgo` days before now (UTC). */
function isoDateTime(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

/** ISO timestamp for the start of the current UTC month (day 1, 00:00:00Z). */
function startOfUtcMonthIso(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

// ─── R2 operation classification (Class A vs Class B) ─────────────
// Class A = mutating/list ops (billed at the higher rate); Class B = reads.
// Deletes and multipart aborts are free and counted toward neither meter.
const R2_CLASS_B = new Set(['GetObject', 'HeadObject', 'HeadBucket', 'UsageSummary']);
const R2_FREE = new Set(['DeleteObject', 'DeleteObjects', 'AbortMultipartUpload', 'DeleteBucket']);
function classifyR2(actionType: string): 'A' | 'B' | 'free' {
  if (R2_FREE.has(actionType)) return 'free';
  if (R2_CLASS_B.has(actionType)) return 'B';
  return 'A';
}

// ─── Route handler ────────────────────────────────────────────────

export const POST: RequestHandler = async ({ url, request, locals }) => {
  const session = await locals.auth();
  if (!session?.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  let token = '';
  try {
    const body = await request.json();
    token = (body.apiToken || '').trim();
  } catch {
    // invalid body
  }

  if (!token) {
    return json({ error: 'Not connected. Open the widget and paste a Cloudflare API token.' }, { status: 400 });
  }

  const action = url.searchParams.get('action');
  const skipCache = url.searchParams.get('skipCache') === '1';
  const scope = token.slice(-10); // cache scoping only; never returned

  try {
    switch (action) {
      case 'verify':
        return await handleVerify(token);
      case 'accounts':
        return await handleAccounts(token, scope, skipCache);
      case 'overview':
        return await handleOverview(token, url, scope, skipCache);
      case 'zones':
        return await handleZones(token, url, scope, skipCache);
      case 'zone-analytics':
        return await handleZoneAnalytics(token, url, scope, skipCache);
      case 'pages':
        return await handlePages(token, url, scope, skipCache);
      case 'workers':
        return await handleWorkers(token, url, scope, skipCache);
      case 'kv':
        return await handleKV(token, url, scope, skipCache);
      case 'r2':
        return await handleR2(token, url, scope, skipCache);
      case 'd1':
        return await handleD1(token, url, scope, skipCache);
      case 'queues':
        return await handleQueues(token, url, scope, skipCache);
      case 'security':
        return await handleSecurity(token, url, scope, skipCache);
      case 'web-analytics':
        return await handleWebAnalytics(token, url, scope, skipCache);
      case 'durable-objects':
        return await handleDurableObjects(token, url, scope, skipCache);
      default:
        return json({ error: 'Invalid action.' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof ReconnectRequiredError) {
      return json({ error: error.message, code: 'reconnect_required' }, { status: 401 });
    }
    console.error('Cloudflare API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch Cloudflare data';
    return json({ error: message }, { status: 500 });
  }
};

// ─── verify ───────────────────────────────────────────────────────

async function handleVerify(token: string) {
  const res = await fetch(`${CF_API}/user/tokens/verify`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  const body = (await res.json()) as CfEnvelope<{ id: string; status: string }>;
  if (!res.ok || !body.success || body.result?.status !== 'active') {
    const msg = body.errors?.[0]?.message || 'Token verification failed.';
    return json({ valid: false, error: msg }, { status: 401 });
  }
  return json({ valid: true, status: body.result.status });
}

// ─── accounts ─────────────────────────────────────────────────────

interface CfAccount {
  id: string;
  name: string;
}

async function handleAccounts(token: string, scope: string, skipCache: boolean) {
  const key = `accounts:${scope}`;
  if (!skipCache) {
    const cached = getCached(key);
    if (cached) return json(cached);
  }
  const body = await cfFetch<CfAccount[]>(token, '/accounts?per_page=50');
  const accounts = (body.result || []).map((a) => ({ id: a.id, name: a.name }));
  const result = { accounts };
  setCache(key, result);
  return json(result);
}

// ─── zones ────────────────────────────────────────────────────────

interface CfZone {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  plan?: { name?: string };
}

async function fetchZones(token: string, accountId: string): Promise<{ id: string; name: string; status: string; plan: string }[]> {
  const body = await cfFetch<CfZone[]>(token, `/zones?account.id=${encodeURIComponent(accountId)}&per_page=50&status=active`);
  return (body.result || []).map((z) => ({
    id: z.id,
    name: z.name,
    status: z.status,
    plan: z.plan?.name || 'Free'
  }));
}

async function handleZones(token: string, url: URL, scope: string, skipCache: boolean) {
  const accountId = requireParam(url, 'accountId');
  const key = `zones:${scope}:${accountId}`;
  if (!skipCache) {
    const cached = getCached(key);
    if (cached) return json(cached);
  }
  const zones = await fetchZones(token, accountId);
  const result = { zones };
  setCache(key, result);
  return json(result);
}

// ─── Reusable "current window" usage fetchers ─────────────────────
// Each returns null on any failure (missing scope, no product) so callers can
// treat absence uniformly. Used by both the Overview health rollup and the
// per-product tabs.

/** Workers requests/errors/subrequests + p99 CPU, grouped by UTC day. */
async function fetchWorkersByDay(
  token: string,
  accountId: string,
  days: number
): Promise<{ daily: { date: string; requests: number; errors: number; subrequests: number }[]; cpuP50: number; cpuP99: number } | null> {
  try {
    const query = `
      query ($accountTag: String!, $since: Time!, $until: Time!) {
        viewer { accounts(filter: { accountTag: $accountTag }) {
          workersInvocationsAdaptive(limit: 10000, filter: { datetime_geq: $since, datetime_leq: $until }, orderBy: [datetimeHour_ASC]) {
            dimensions { datetimeHour }
            sum { requests errors subrequests }
            quantiles { cpuTimeP50 cpuTimeP99 }
          }
        } }
      }`;
    const data = await cfGraphQL<{ viewer: { accounts: { workersInvocationsAdaptive: { dimensions: { datetimeHour: string }; sum: { requests: number; errors: number; subrequests: number }; quantiles: { cpuTimeP50: number; cpuTimeP99: number } }[] }[] } }>(
      token,
      query,
      { accountTag: accountId, since: isoDateTime(days), until: isoDateTime(0) }
    );
    const groups = data.viewer.accounts[0]?.workersInvocationsAdaptive || [];
    const byDay = new Map<string, { requests: number; errors: number; subrequests: number }>();
    let cpuP50 = 0;
    let cpuP99 = 0;
    for (const g of groups) {
      const date = g.dimensions.datetimeHour.slice(0, 10);
      const cur = byDay.get(date) || { requests: 0, errors: 0, subrequests: 0 };
      cur.requests += g.sum.requests;
      cur.errors += g.sum.errors;
      cur.subrequests += g.sum.subrequests;
      byDay.set(date, cur);
      cpuP50 = Math.max(cpuP50, g.quantiles?.cpuTimeP50 ?? 0);
      cpuP99 = Math.max(cpuP99, g.quantiles?.cpuTimeP99 ?? 0);
    }
    const daily = [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, ...v }));
    return { daily, cpuP50, cpuP99 };
  } catch (e) {
    console.warn('Workers by-day analytics unavailable:', e instanceof Error ? e.message : e);
    return null;
  }
}

/** KV operations grouped by UTC day and action type. */
async function fetchKvOpsByDay(
  token: string,
  accountId: string,
  days: number
): Promise<{ date: string; read: number; write: number; delete: number; list: number }[] | null> {
  try {
    const data = await cfGraphQL<{ viewer: { accounts: { kvOperationsAdaptiveGroups: { dimensions: { date: string; actionType: string }; sum: { requests: number } }[] }[] } }>(
      token,
      `query ($accountTag: String!, $since: Date!, $until: Date!) {
        viewer { accounts(filter: { accountTag: $accountTag }) {
          kvOperationsAdaptiveGroups(limit: 10000, filter: { date_geq: $since, date_leq: $until }, dimensions: { date, actionType }) {
            dimensions { date actionType } sum { requests }
          } } } }`,
      { accountTag: accountId, since: isoDate(days - 1), until: isoDate(0) }
    );
    const byDay = new Map<string, { read: number; write: number; delete: number; list: number }>();
    for (const g of data.viewer.accounts[0]?.kvOperationsAdaptiveGroups || []) {
      const row = byDay.get(g.dimensions.date) || { read: 0, write: 0, delete: 0, list: 0 };
      const t = g.dimensions.actionType.toLowerCase();
      if (t in row) (row as Record<string, number>)[t] += g.sum.requests;
      byDay.set(g.dimensions.date, row);
    }
    return [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, v]) => ({ date, ...v }));
  } catch (e) {
    console.warn('KV ops unavailable:', e instanceof Error ? e.message : e);
    return null;
  }
}

/** KV storage snapshot (latest keyCount/byteCount per namespace) within window. */
async function fetchKvStorage(
  token: string,
  accountId: string,
  days: number
): Promise<Map<string, { keys: number; bytes: number }> | null> {
  try {
    const data = await cfGraphQL<{ viewer: { accounts: { kvStorageAdaptiveGroups: { dimensions: { namespaceId: string }; max: { keyCount: number; byteCount: number } }[] }[] } }>(
      token,
      `query ($accountTag: String!, $since: Date!, $until: Date!) {
        viewer { accounts(filter: { accountTag: $accountTag }) {
          kvStorageAdaptiveGroups(limit: 10000, filter: { date_geq: $since, date_leq: $until }, dimensions: { namespaceId }, orderBy: [date_DESC]) {
            dimensions { namespaceId } max { keyCount byteCount }
          } } } }`,
      { accountTag: accountId, since: isoDate(days - 1), until: isoDate(0) }
    );
    const byNs = new Map<string, { keys: number; bytes: number }>();
    for (const g of data.viewer.accounts[0]?.kvStorageAdaptiveGroups || []) {
      if (!byNs.has(g.dimensions.namespaceId)) {
        byNs.set(g.dimensions.namespaceId, { keys: g.max.keyCount, bytes: g.max.byteCount });
      }
    }
    return byNs;
  } catch (e) {
    console.warn('KV storage unavailable:', e instanceof Error ? e.message : e);
    return null;
  }
}

/** D1 query/row analytics grouped by day and database. */
async function fetchD1ByDay(
  token: string,
  accountId: string,
  days: number
): Promise<{ date: string; databaseId: string; readQueries: number; writeQueries: number; rowsRead: number; rowsWritten: number }[] | null> {
  try {
    const data = await cfGraphQL<{ viewer: { accounts: { d1AnalyticsAdaptiveGroups: { dimensions: { date: string; databaseId: string }; sum: { readQueries: number; writeQueries: number; rowsRead: number; rowsWritten: number } }[] }[] } }>(
      token,
      `query ($accountTag: String!, $since: Date!, $until: Date!) {
        viewer { accounts(filter: { accountTag: $accountTag }) {
          d1AnalyticsAdaptiveGroups(limit: 10000, filter: { date_geq: $since, date_leq: $until }, dimensions: { date, databaseId }) {
            dimensions { date databaseId } sum { readQueries writeQueries rowsRead rowsWritten }
          } } } }`,
      { accountTag: accountId, since: isoDate(days - 1), until: isoDate(0) }
    );
    return (data.viewer.accounts[0]?.d1AnalyticsAdaptiveGroups || []).map((g) => ({
      date: g.dimensions.date,
      databaseId: g.dimensions.databaseId,
      ...g.sum
    }));
  } catch (e) {
    console.warn('D1 analytics unavailable:', e instanceof Error ? e.message : e);
    return null;
  }
}

/** R2 operations month-to-date, split into Class A / Class B. */
async function fetchR2OpsMonth(token: string, accountId: string): Promise<{ classA: number; classB: number } | null> {
  try {
    const data = await cfGraphQL<{ viewer: { accounts: { r2OperationsAdaptiveGroups: { dimensions: { actionType: string }; sum: { requests: number } }[] }[] } }>(
      token,
      `query ($accountTag: String!, $since: Time!, $until: Time!) {
        viewer { accounts(filter: { accountTag: $accountTag }) {
          r2OperationsAdaptiveGroups(limit: 10000, filter: { datetime_geq: $since, datetime_leq: $until }, dimensions: { actionType }) {
            dimensions { actionType } sum { requests }
          } } } }`,
      { accountTag: accountId, since: startOfUtcMonthIso(), until: isoDateTime(0) }
    );
    let classA = 0;
    let classB = 0;
    for (const g of data.viewer.accounts[0]?.r2OperationsAdaptiveGroups || []) {
      const cls = classifyR2(g.dimensions.actionType);
      if (cls === 'A') classA += g.sum.requests;
      else if (cls === 'B') classB += g.sum.requests;
    }
    return { classA, classB };
  } catch (e) {
    console.warn('R2 ops unavailable:', e instanceof Error ? e.message : e);
    return null;
  }
}

/** R2 storage snapshot (latest per bucket) from the last day. */
async function fetchR2Storage(token: string, accountId: string): Promise<Map<string, { objects: number; bytes: number }> | null> {
  try {
    const data = await cfGraphQL<{ viewer: { accounts: { r2StorageAdaptiveGroups: { dimensions: { bucketName: string }; max: { objectCount: number; payloadSize: number; metadataSize: number } }[] }[] } }>(
      token,
      `query ($accountTag: String!, $since: Time!, $until: Time!) {
        viewer { accounts(filter: { accountTag: $accountTag }) {
          r2StorageAdaptiveGroups(limit: 10000, filter: { datetime_geq: $since, datetime_leq: $until }, dimensions: { bucketName }, orderBy: [datetime_DESC]) {
            dimensions { bucketName } max { objectCount payloadSize metadataSize }
          } } } }`,
      { accountTag: accountId, since: isoDateTime(1), until: isoDateTime(0) }
    );
    const byBucket = new Map<string, { objects: number; bytes: number }>();
    for (const g of data.viewer.accounts[0]?.r2StorageAdaptiveGroups || []) {
      if (!byBucket.has(g.dimensions.bucketName)) {
        byBucket.set(g.dimensions.bucketName, { objects: g.max.objectCount, bytes: g.max.payloadSize + g.max.metadataSize });
      }
    }
    return byBucket;
  } catch (e) {
    console.warn('R2 storage unavailable:', e instanceof Error ? e.message : e);
    return null;
  }
}

/** Count of Pages deployments (builds) created this month, across projects. */
async function fetchPagesBuildsThisMonth(token: string, accountId: string, projectNames: string[]): Promise<number | null> {
  const monthStart = startOfUtcMonthIso();
  try {
    let total = 0;
    // Cap to keep the fan-out bounded; free tier rarely has many projects.
    for (const name of projectNames.slice(0, 20)) {
      try {
        const body = await cfFetch<{ created_on: string }[]>(
          token,
          `/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(name)}/deployments?per_page=100`
        );
        total += (body.result || []).filter((d) => d.created_on >= monthStart).length;
      } catch {
        /* one project's deployments unreadable — skip */
      }
    }
    return total;
  } catch (e) {
    console.warn('Pages builds unavailable:', e instanceof Error ? e.message : e);
    return null;
  }
}

/** Sum only today's (current UTC day) row out of a by-day series. */
function pickToday<T extends { date: string }>(rows: T[] | null): T | null {
  if (!rows) return null;
  const today = isoDate(0);
  return rows.find((r) => r.date === today) ?? null;
}

// ─── zone analytics (GraphQL httpRequests1dGroups + adaptive breakdowns) ──

interface HttpRequests1dGroup {
  dimensions: { date: string };
  sum: { requests: number; bytes: number; cachedRequests: number; cachedBytes: number; threats: number; pageViews: number };
  uniq: { uniques: number };
}

async function fetchZoneSeries(token: string, zoneId: string, days: number) {
  const query = `
    query ($zoneTag: String!, $since: String!, $until: String!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequests1dGroups(
            limit: 60
            filter: { date_geq: $since, date_leq: $until }
            orderBy: [date_ASC]
          ) {
            dimensions { date }
            sum { requests bytes cachedRequests cachedBytes threats pageViews }
            uniq { uniques }
          }
        }
      }
    }`;
  const data = await cfGraphQL<{ viewer: { zones: { httpRequests1dGroups: HttpRequests1dGroup[] }[] } }>(
    token,
    query,
    { zoneTag: zoneId, since: isoDate(days - 1), until: isoDate(0) }
  );

  const groups = data.viewer.zones[0]?.httpRequests1dGroups || [];
  const series = groups.map((g) => ({
    date: g.dimensions.date,
    requests: g.sum.requests,
    bytes: g.sum.bytes,
    cachedRequests: g.sum.cachedRequests,
    cachedBytes: g.sum.cachedBytes,
    threats: g.sum.threats,
    pageViews: g.sum.pageViews,
    uniques: g.uniq.uniques
  }));

  const totals = series.reduce(
    (acc, s) => ({
      requests: acc.requests + s.requests,
      bytes: acc.bytes + s.bytes,
      cachedRequests: acc.cachedRequests + s.cachedRequests,
      threats: acc.threats + s.threats,
      pageViews: acc.pageViews + s.pageViews,
      uniques: acc.uniques + s.uniques
    }),
    { requests: 0, bytes: 0, cachedRequests: 0, threats: 0, pageViews: 0, uniques: 0 }
  );

  return { series, totals };
}

/** Status-code, country and cache-status breakdowns via httpRequestsAdaptiveGroups. */
async function fetchZoneBreakdown(token: string, zoneId: string, days: number) {
  try {
    const query = `
      query ($zoneTag: String!, $since: Time!, $until: Time!) {
        viewer { zones(filter: { zoneTag: $zoneTag }) {
          byStatus: httpRequestsAdaptiveGroups(limit: 100, filter: { datetime_geq: $since, datetime_leq: $until }, dimensions: { edgeResponseStatus }, orderBy: [count_DESC]) {
            count dimensions { edgeResponseStatus }
          }
          byCountry: httpRequestsAdaptiveGroups(limit: 8, filter: { datetime_geq: $since, datetime_leq: $until }, dimensions: { clientCountryName }, orderBy: [count_DESC]) {
            count dimensions { clientCountryName }
          }
          byCache: httpRequestsAdaptiveGroups(limit: 20, filter: { datetime_geq: $since, datetime_leq: $until }, dimensions: { cacheStatus }, orderBy: [count_DESC]) {
            count dimensions { cacheStatus }
          }
        } }
      }`;
    const data = await cfGraphQL<{
      viewer: { zones: { byStatus: { count: number; dimensions: { edgeResponseStatus: number } }[]; byCountry: { count: number; dimensions: { clientCountryName: string } }[]; byCache: { count: number; dimensions: { cacheStatus: string } }[] }[] };
    }>(token, query, { zoneTag: zoneId, since: isoDateTime(days), until: isoDateTime(0) });

    const z = data.viewer.zones[0];
    if (!z) return null;

    const statusBuckets = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
    for (const g of z.byStatus || []) {
      const s = g.dimensions.edgeResponseStatus;
      if (s >= 200 && s < 300) statusBuckets['2xx'] += g.count;
      else if (s >= 300 && s < 400) statusBuckets['3xx'] += g.count;
      else if (s >= 400 && s < 500) statusBuckets['4xx'] += g.count;
      else if (s >= 500) statusBuckets['5xx'] += g.count;
    }
    const topCountries = (z.byCountry || []).map((g) => ({ country: g.dimensions.clientCountryName, requests: g.count }));
    const cacheStatus = (z.byCache || []).map((g) => ({ status: g.dimensions.cacheStatus, requests: g.count }));
    return { statusBuckets, topCountries, cacheStatus };
  } catch (e) {
    console.warn('Zone breakdown unavailable:', e instanceof Error ? e.message : e);
    return null;
  }
}

async function handleZoneAnalytics(token: string, url: URL, scope: string, skipCache: boolean) {
  const zoneId = requireParam(url, 'zoneId');
  const days = clampDays(url.searchParams.get('days'));
  const key = `zone-analytics:${scope}:${zoneId}:${days}`;
  if (!skipCache) {
    const cached = getCached(key);
    if (cached) return json(cached);
  }
  const base = await fetchZoneSeries(token, zoneId, days);
  const breakdown = await fetchZoneBreakdown(token, zoneId, days);
  const result = { ...base, breakdown };
  setCache(key, result);
  return json(result);
}

// ─── overview (account rollup + limits usage) ─────────────────────

async function handleOverview(token: string, url: URL, scope: string, skipCache: boolean) {
  const accountId = requireParam(url, 'accountId');
  const days = clampDays(url.searchParams.get('days'));
  const key = `overview:${scope}:${accountId}:${days}`;
  if (!skipCache) {
    const cached = getCached(key);
    if (cached) return json(cached);
  }

  const zones = await fetchZones(token, accountId);

  // Aggregate traffic across every zone in the account (one GraphQL call).
  let series: { date: string; requests: number; bytes: number }[] = [];
  const totals = { requests: 0, bytes: 0, threats: 0, cachedRequests: 0 };
  if (zones.length > 0) {
    const query = `
      query ($zoneTags: [String!], $since: String!, $until: String!) {
        viewer {
          zones(filter: { zoneTag_in: $zoneTags }) {
            httpRequests1dGroups(
              limit: 1000
              filter: { date_geq: $since, date_leq: $until }
              orderBy: [date_ASC]
            ) {
              dimensions { date }
              sum { requests bytes threats cachedRequests }
            }
          }
        }
      }`;
    try {
      const data = await cfGraphQL<{
        viewer: { zones: { httpRequests1dGroups: { dimensions: { date: string }; sum: { requests: number; bytes: number; threats: number; cachedRequests: number } }[] }[] };
      }>(token, query, { zoneTags: zones.map((z) => z.id), since: isoDate(days - 1), until: isoDate(0) });

      // Sum per-date across all zones
      const byDate = new Map<string, { requests: number; bytes: number }>();
      for (const zone of data.viewer.zones) {
        for (const g of zone.httpRequests1dGroups) {
          const cur = byDate.get(g.dimensions.date) || { requests: 0, bytes: 0 };
          cur.requests += g.sum.requests;
          cur.bytes += g.sum.bytes;
          byDate.set(g.dimensions.date, cur);
          totals.requests += g.sum.requests;
          totals.bytes += g.sum.bytes;
          totals.threats += g.sum.threats;
          totals.cachedRequests += g.sum.cachedRequests;
        }
      }
      series = [...byDate.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, v]) => ({ date, requests: v.requests, bytes: v.bytes }));
    } catch (e) {
      // Analytics permission may be missing — still return counts below.
      console.warn('Overview analytics unavailable:', e instanceof Error ? e.message : e);
    }
  }

  // Resource inventory (best-effort; permissions may be absent)
  let pagesProjects: string[] = [];
  let workersCount = 0;
  try {
    const p = await cfFetch<{ name: string }[]>(token, `/accounts/${encodeURIComponent(accountId)}/pages/projects`);
    pagesProjects = (p.result || []).map((x) => x.name);
  } catch { /* pages permission missing */ }
  try {
    const w = await cfFetch<{ id: string }[]>(token, `/accounts/${encodeURIComponent(accountId)}/workers/scripts`);
    workersCount = (w.result || []).length;
  } catch { /* workers permission missing */ }

  // ─── Limits usage rollup (current window per product) ───
  // All fetched concurrently; each is best-effort and independent.
  const [workersByDay, kvByDay, kvStorage, d1ByDay, r2Ops, r2Storage, pagesBuilds] = await Promise.all([
    fetchWorkersByDay(token, accountId, 1),
    fetchKvOpsByDay(token, accountId, 1),
    fetchKvStorage(token, accountId, 1),
    fetchD1ByDay(token, accountId, 1),
    fetchR2OpsMonth(token, accountId),
    fetchR2Storage(token, accountId),
    fetchPagesBuildsThisMonth(token, accountId, pagesProjects)
  ]);

  const kvToday = pickToday(kvByDay);
  const workersToday = pickToday(workersByDay?.daily ?? null);

  // D1 today = sum across databases for the current UTC day.
  let d1Today: { rowsRead: number; rowsWritten: number } | null = null;
  if (d1ByDay) {
    const today = isoDate(0);
    d1Today = d1ByDay
      .filter((r) => r.date === today)
      .reduce((acc, r) => ({ rowsRead: acc.rowsRead + r.rowsRead, rowsWritten: acc.rowsWritten + r.rowsWritten }), { rowsRead: 0, rowsWritten: 0 });
  }

  const kvBytes = kvStorage ? [...kvStorage.values()].reduce((a, s) => a + s.bytes, 0) : null;
  const kvKeys = kvStorage ? [...kvStorage.values()].reduce((a, s) => a + s.keys, 0) : null;
  const r2Bytes = r2Storage ? [...r2Storage.values()].reduce((a, s) => a + s.bytes, 0) : null;

  const usage = {
    workers: workersToday ? { requests: workersToday.requests, errors: workersToday.errors } : null,
    kv:
      kvToday || kvBytes !== null
        ? {
            read: kvToday?.read ?? null,
            write: kvToday?.write ?? null,
            delete: kvToday?.delete ?? null,
            list: kvToday?.list ?? null,
            storageBytes: kvBytes,
            keys: kvKeys
          }
        : null,
    d1: d1Today ? { rowsRead: d1Today.rowsRead, rowsWritten: d1Today.rowsWritten } : null,
    r2:
      r2Ops || r2Bytes !== null
        ? { classA: r2Ops?.classA ?? null, classB: r2Ops?.classB ?? null, storageBytes: r2Bytes }
        : null,
    pages: pagesBuilds !== null ? { builds: pagesBuilds } : null
  };

  const result = {
    zonesCount: zones.length,
    pagesCount: pagesProjects.length,
    workersCount,
    totals,
    series,
    usage
  };
  setCache(key, result);
  return json(result);
}

// ─── pages ────────────────────────────────────────────────────────

interface CfPagesProject {
  name: string;
  subdomain: string;
  domains: string[];
  latest_deployment?: {
    id: string;
    environment: string;
    created_on: string;
    url: string;
    latest_stage?: { name: string; status: string };
    deployment_trigger?: { metadata?: { branch?: string; commit_message?: string } };
  };
}

async function handlePages(token: string, url: URL, scope: string, skipCache: boolean) {
  const accountId = requireParam(url, 'accountId');
  const key = `pages:${scope}:${accountId}`;
  if (!skipCache) {
    const cached = getCached(key);
    if (cached) return json(cached);
  }
  const body = await cfFetch<CfPagesProject[]>(token, `/accounts/${encodeURIComponent(accountId)}/pages/projects`);
  const projects = (body.result || []).map((p) => {
    const dep = p.latest_deployment;
    return {
      name: p.name,
      subdomain: p.subdomain,
      domains: p.domains || [],
      deployment: dep
        ? {
            environment: dep.environment,
            createdOn: dep.created_on,
            url: dep.url,
            status: dep.latest_stage?.status || 'unknown',
            stage: dep.latest_stage?.name || '',
            branch: dep.deployment_trigger?.metadata?.branch || '',
            message: dep.deployment_trigger?.metadata?.commit_message || ''
          }
        : null
    };
  });
  const builds = await fetchPagesBuildsThisMonth(token, accountId, projects.map((p) => p.name));
  const result = { projects, builds };
  setCache(key, result);
  return json(result);
}

// ─── workers (scripts + invocation analytics + daily series) ──────

interface CfWorkerScript {
  id: string;
  created_on: string;
  modified_on: string;
}

interface WorkersInvocationGroup {
  dimensions: { scriptName: string };
  sum: { requests: number; errors: number; subrequests: number };
  quantiles: { cpuTimeP50: number; cpuTimeP99: number };
}

async function handleWorkers(token: string, url: URL, scope: string, skipCache: boolean) {
  const accountId = requireParam(url, 'accountId');
  const days = clampDays(url.searchParams.get('days'));
  const key = `workers:${scope}:${accountId}:${days}`;
  if (!skipCache) {
    const cached = getCached(key);
    if (cached) return json(cached);
  }

  const scriptsBody = await cfFetch<CfWorkerScript[]>(token, `/accounts/${encodeURIComponent(accountId)}/workers/scripts`);
  const scripts = scriptsBody.result || [];

  // Per-worker invocation analytics (best-effort — needs Account Analytics read)
  const statsByName = new Map<string, { requests: number; errors: number; subrequests: number; cpuP50: number; cpuP99: number }>();
  try {
    const query = `
      query ($accountTag: String!, $since: Time!, $until: Time!) {
        viewer {
          accounts(filter: { accountTag: $accountTag }) {
            workersInvocationsAdaptive(
              limit: 100
              filter: { datetime_geq: $since, datetime_leq: $until }
              orderBy: [sum_requests_DESC]
            ) {
              dimensions { scriptName }
              sum { requests errors subrequests }
              quantiles { cpuTimeP50 cpuTimeP99 }
            }
          }
        }
      }`;
    const data = await cfGraphQL<{ viewer: { accounts: { workersInvocationsAdaptive: WorkersInvocationGroup[] }[] } }>(
      token,
      query,
      { accountTag: accountId, since: isoDateTime(days), until: isoDateTime(0) }
    );
    const groups = data.viewer.accounts[0]?.workersInvocationsAdaptive || [];
    for (const g of groups) {
      const prev = statsByName.get(g.dimensions.scriptName) || { requests: 0, errors: 0, subrequests: 0, cpuP50: 0, cpuP99: 0 };
      statsByName.set(g.dimensions.scriptName, {
        requests: prev.requests + g.sum.requests,
        errors: prev.errors + g.sum.errors,
        subrequests: prev.subrequests + g.sum.subrequests,
        cpuP50: g.quantiles?.cpuTimeP50 ?? prev.cpuP50,
        cpuP99: g.quantiles?.cpuTimeP99 ?? prev.cpuP99
      });
    }
  } catch (e) {
    console.warn('Worker analytics unavailable:', e instanceof Error ? e.message : e);
  }

  const merged = scripts.map((s) => {
    const stats = statsByName.get(s.id);
    return {
      name: s.id,
      modifiedOn: s.modified_on,
      createdOn: s.created_on,
      requests: stats?.requests ?? null,
      errors: stats?.errors ?? null,
      subrequests: stats?.subrequests ?? null,
      cpuP50: stats?.cpuP50 ?? null,
      cpuP99: stats?.cpuP99 ?? null
    };
  });

  // Sort by request volume (nulls last), then by most recently modified
  merged.sort((a, b) => {
    if (a.requests !== b.requests) return (b.requests ?? -1) - (a.requests ?? -1);
    return b.modifiedOn.localeCompare(a.modifiedOn);
  });

  // Account-wide daily series (for the chart + today's-usage meter + CPU ceiling)
  const byDay = await fetchWorkersByDay(token, accountId, days);
  const today = pickToday(byDay?.daily ?? null);
  const windowTotals = (byDay?.daily ?? []).reduce(
    (acc, d) => ({ requests: acc.requests + d.requests, errors: acc.errors + d.errors, subrequests: acc.subrequests + d.subrequests }),
    { requests: 0, errors: 0, subrequests: 0 }
  );

  const result = {
    scripts: merged,
    analyticsAvailable: statsByName.size > 0 || !!byDay,
    daily: byDay?.daily ?? [],
    today: today ? { requests: today.requests, errors: today.errors, subrequests: today.subrequests } : null,
    windowTotals,
    cpuP50: byDay?.cpuP50 ?? null,
    cpuP99: byDay?.cpuP99 ?? null
  };
  setCache(key, result);
  return json(result);
}

// ─── KV (namespaces + operations + storage) ───────────────────────

async function handleKV(token: string, url: URL, scope: string, skipCache: boolean) {
  const accountId = requireParam(url, 'accountId');
  const days = clampDays(url.searchParams.get('days'));
  const key = `kv:${scope}:${accountId}:${days}`;
  if (!skipCache) {
    const cached = getCached(key);
    if (cached) return json(cached);
  }

  // Namespaces (REST)
  const nsBody = await cfFetch<{ id: string; title: string }[]>(token, `/accounts/${encodeURIComponent(accountId)}/storage/kv/namespaces`);
  const namespaces: { id: string; title: string; keys: number | null; bytes: number | null }[] = (nsBody.result || []).map((n) => ({
    id: n.id,
    title: n.title,
    keys: null,
    bytes: null
  }));

  // Operations by day + action type (best-effort)
  const byDay = await fetchKvOpsByDay(token, accountId, days);
  const today = pickToday(byDay);
  const windowOps = (byDay ?? []).reduce(
    (acc, d) => ({ read: acc.read + d.read, write: acc.write + d.write, delete: acc.delete + d.delete, list: acc.list + d.list }),
    { read: 0, write: 0, delete: 0, list: 0 }
  );

  // Storage per namespace (best-effort)
  const kvStorage = await fetchKvStorage(token, accountId, days);
  const storage = { keys: 0, bytes: 0 };
  if (kvStorage) {
    for (const ns of namespaces) {
      const s = kvStorage.get(ns.id);
      if (s) {
        ns.keys = s.keys;
        ns.bytes = s.bytes;
        storage.keys += s.keys;
        storage.bytes += s.bytes;
      }
    }
  }

  const result = {
    namespaces,
    today: today ? { read: today.read, write: today.write, delete: today.delete, list: today.list } : null,
    windowOps,
    daily: byDay ?? [],
    storage,
    analyticsAvailable: !!byDay
  };
  setCache(key, result);
  return json(result);
}

// ─── R2 (buckets + operations + storage) ──────────────────────────

async function handleR2(token: string, url: URL, scope: string, skipCache: boolean) {
  const accountId = requireParam(url, 'accountId');
  const key = `r2:${scope}:${accountId}`;
  if (!skipCache) {
    const cached = getCached(key);
    if (cached) return json(cached);
  }

  // Buckets (REST) — result is { buckets: [...] }
  const bBody = await cfFetch<{ buckets: { name: string; creation_date: string }[] }>(token, `/accounts/${encodeURIComponent(accountId)}/r2/buckets`);
  const buckets: { name: string; createdOn: string; objects: number | null; bytes: number | null }[] = (bBody.result?.buckets || []).map((b) => ({
    name: b.name,
    createdOn: b.creation_date,
    objects: null,
    bytes: null
  }));

  // Operations month-to-date, split Class A/B (best-effort)
  const ops = await fetchR2OpsMonth(token, accountId);

  // Storage snapshot per bucket (best-effort)
  const r2Storage = await fetchR2Storage(token, accountId);
  const storage = { objects: 0, bytes: 0 };
  if (r2Storage) {
    for (const bucket of buckets) {
      const s = r2Storage.get(bucket.name);
      if (s) {
        bucket.objects = s.objects;
        bucket.bytes = s.bytes;
        storage.objects += s.objects;
        storage.bytes += s.bytes;
      }
    }
  }

  const result = {
    buckets,
    month: ops ? { classA: ops.classA, classB: ops.classB } : null,
    storage,
    analyticsAvailable: !!ops
  };
  setCache(key, result);
  return json(result);
}

// ─── D1 (databases + query analytics) ─────────────────────────────

async function handleD1(token: string, url: URL, scope: string, skipCache: boolean) {
  const accountId = requireParam(url, 'accountId');
  const days = clampDays(url.searchParams.get('days'));
  const key = `d1:${scope}:${accountId}:${days}`;
  if (!skipCache) {
    const cached = getCached(key);
    if (cached) return json(cached);
  }

  // Databases (REST) — includes file_size and num_tables
  const dbBody = await cfFetch<{ uuid: string; name: string; version: string; num_tables?: number; file_size?: number }[]>(
    token,
    `/accounts/${encodeURIComponent(accountId)}/d1/database`
  );
  const databases = (dbBody.result || []).map((d) => ({
    id: d.uuid,
    name: d.name,
    version: d.version,
    tables: d.num_tables ?? null,
    bytes: d.file_size ?? null,
    readQueries: null as number | null,
    writeQueries: null as number | null,
    rowsRead: null as number | null,
    rowsWritten: null as number | null,
    rowsReadToday: null as number | null,
    rowsWrittenToday: null as number | null
  }));

  const byDay = await fetchD1ByDay(token, accountId, days);
  const windowTotals = { readQueries: 0, writeQueries: 0, rowsRead: 0, rowsWritten: 0 };
  const today = { rowsRead: 0, rowsWritten: 0 };
  if (byDay) {
    const todayStr = isoDate(0);
    const perDbWindow = new Map<string, { readQueries: number; writeQueries: number; rowsRead: number; rowsWritten: number }>();
    const perDbToday = new Map<string, { rowsRead: number; rowsWritten: number }>();
    for (const r of byDay) {
      const w = perDbWindow.get(r.databaseId) || { readQueries: 0, writeQueries: 0, rowsRead: 0, rowsWritten: 0 };
      w.readQueries += r.readQueries;
      w.writeQueries += r.writeQueries;
      w.rowsRead += r.rowsRead;
      w.rowsWritten += r.rowsWritten;
      perDbWindow.set(r.databaseId, w);
      windowTotals.readQueries += r.readQueries;
      windowTotals.writeQueries += r.writeQueries;
      windowTotals.rowsRead += r.rowsRead;
      windowTotals.rowsWritten += r.rowsWritten;
      if (r.date === todayStr) {
        const t = perDbToday.get(r.databaseId) || { rowsRead: 0, rowsWritten: 0 };
        t.rowsRead += r.rowsRead;
        t.rowsWritten += r.rowsWritten;
        perDbToday.set(r.databaseId, t);
        today.rowsRead += r.rowsRead;
        today.rowsWritten += r.rowsWritten;
      }
    }
    for (const db of databases) {
      const w = perDbWindow.get(db.id);
      if (w) {
        db.readQueries = w.readQueries;
        db.writeQueries = w.writeQueries;
        db.rowsRead = w.rowsRead;
        db.rowsWritten = w.rowsWritten;
      }
      const t = perDbToday.get(db.id);
      if (t) {
        db.rowsReadToday = t.rowsRead;
        db.rowsWrittenToday = t.rowsWritten;
      }
    }
  }

  const result = {
    databases,
    windowTotals,
    today,
    analyticsAvailable: !!byDay
  };
  setCache(key, result);
  return json(result);
}

// ─── Queues (list + backlog/throughput) ───────────────────────────

async function handleQueues(token: string, url: URL, scope: string, skipCache: boolean) {
  const accountId = requireParam(url, 'accountId');
  const key = `queues:${scope}:${accountId}`;
  if (!skipCache) {
    const cached = getCached(key);
    if (cached) return json(cached);
  }

  const body = await cfFetch<{ queue_id?: string; queue_name?: string; name?: string; created_on: string; producers_total_count?: number; consumers_total_count?: number }[]>(
    token,
    `/accounts/${encodeURIComponent(accountId)}/queues`
  );
  const queues = (body.result || []).map((q) => ({
    id: q.queue_id || '',
    name: q.queue_name || q.name || q.queue_id || 'queue',
    createdOn: q.created_on,
    producers: q.producers_total_count ?? 0,
    consumers: q.consumers_total_count ?? 0,
    backlogMessages: null as number | null,
    backlogBytes: null as number | null
  }));

  // Backlog (best-effort — queues with no recent activity return nothing)
  let analyticsAvailable = false;
  try {
    const data = await cfGraphQL<{ viewer: { accounts: { queueBacklogAdaptiveGroups: { dimensions: { queueId: string }; max: { messages: number; bytes: number } }[] }[] } }>(
      token,
      `query ($accountTag: String!, $since: Time!, $until: Time!) {
        viewer { accounts(filter: { accountTag: $accountTag }) {
          queueBacklogAdaptiveGroups(limit: 1000, filter: { datetime_geq: $since, datetime_leq: $until }, dimensions: { queueId }, orderBy: [datetime_DESC]) {
            dimensions { queueId } max { messages bytes }
          } } } }`,
      { accountTag: accountId, since: isoDateTime(1), until: isoDateTime(0) }
    );
    const byQueue = new Map<string, { messages: number; bytes: number }>();
    for (const g of data.viewer.accounts[0]?.queueBacklogAdaptiveGroups || []) {
      if (!byQueue.has(g.dimensions.queueId)) byQueue.set(g.dimensions.queueId, { messages: g.max.messages, bytes: g.max.bytes });
    }
    for (const q of queues) {
      const b = byQueue.get(q.id);
      if (b) {
        q.backlogMessages = b.messages;
        q.backlogBytes = b.bytes;
      }
    }
    analyticsAvailable = byQueue.size > 0;
  } catch (e) {
    console.warn('Queue backlog unavailable:', e instanceof Error ? e.message : e);
  }

  const result = { queues, analyticsAvailable };
  setCache(key, result);
  return json(result);
}

// ─── security (WAF / firewall events) ─────────────────────────────

async function handleSecurity(token: string, url: URL, scope: string, skipCache: boolean) {
  const zoneId = requireParam(url, 'zoneId');
  const days = clampDays(url.searchParams.get('days'));
  const key = `security:${scope}:${zoneId}:${days}`;
  if (!skipCache) {
    const cached = getCached(key);
    if (cached) return json(cached);
  }

  const query = `
    query ($zoneTag: String!, $since: Time!, $until: Time!) {
      viewer { zones(filter: { zoneTag: $zoneTag }) {
        byAction: firewallEventsAdaptiveGroups(limit: 20, filter: { datetime_geq: $since, datetime_leq: $until }, dimensions: { action }, orderBy: [count_DESC]) {
          count dimensions { action }
        }
        byCountry: firewallEventsAdaptiveGroups(limit: 8, filter: { datetime_geq: $since, datetime_leq: $until }, dimensions: { clientCountryName }, orderBy: [count_DESC]) {
          count dimensions { clientCountryName }
        }
        byRule: firewallEventsAdaptiveGroups(limit: 8, filter: { datetime_geq: $since, datetime_leq: $until }, dimensions: { source, ruleId }, orderBy: [count_DESC]) {
          count dimensions { source ruleId }
        }
      } }
    }`;
  const data = await cfGraphQL<{
    viewer: { zones: { byAction: { count: number; dimensions: { action: string } }[]; byCountry: { count: number; dimensions: { clientCountryName: string } }[]; byRule: { count: number; dimensions: { source: string; ruleId: string } }[] }[] };
  }>(token, query, { zoneTag: zoneId, since: isoDateTime(days), until: isoDateTime(0) });

  const z = data.viewer.zones[0];
  const byAction = (z?.byAction || []).map((g) => ({ action: g.dimensions.action, count: g.count }));
  const topCountries = (z?.byCountry || []).map((g) => ({ country: g.dimensions.clientCountryName, count: g.count }));
  const topRules = (z?.byRule || []).map((g) => ({ source: g.dimensions.source, ruleId: g.dimensions.ruleId, count: g.count }));
  const total = byAction.reduce((a, g) => a + g.count, 0);

  const result = { total, byAction, topCountries, topRules };
  setCache(key, result);
  return json(result);
}

// ─── web analytics / RUM (Core Web Vitals) ────────────────────────

async function handleWebAnalytics(token: string, url: URL, scope: string, skipCache: boolean) {
  const accountId = requireParam(url, 'accountId');
  const days = clampDays(url.searchParams.get('days'));
  const key = `web-analytics:${scope}:${accountId}:${days}`;
  if (!skipCache) {
    const cached = getCached(key);
    if (cached) return json(cached);
  }

  // List Web Analytics sites (RUM). No sites → graceful empty state.
  let sites: { siteTag: string; host: string }[] = [];
  try {
    const s = await cfFetch<{ site_tag: string; ruleset?: { zone_name?: string }; snippet?: unknown }[]>(
      token,
      `/accounts/${encodeURIComponent(accountId)}/rum/site_info/list`
    );
    sites = (s.result || []).map((x) => ({ siteTag: x.site_tag, host: x.ruleset?.zone_name || x.site_tag }));
  } catch (e) {
    console.warn('Web Analytics site list unavailable:', e instanceof Error ? e.message : e);
  }

  if (sites.length === 0) {
    const result = { available: false, sites: [], pageLoads: 0, visits: 0, vitals: null };
    setCache(key, result);
    return json(result);
  }

  // Aggregate page loads + Core Web Vitals across all sites (account scope).
  let pageLoads = 0;
  let visits = 0;
  let vitals: { lcpP75: number | null; inpP75: number | null; clsP75: number | null } | null = null;
  try {
    const query = `
      query ($accountTag: String!, $since: Time!, $until: Time!) {
        viewer { accounts(filter: { accountTag: $accountTag }) {
          rumPageloadEventsAdaptiveGroups(limit: 10000, filter: { datetime_geq: $since, datetime_leq: $until }) {
            count
            sum { visits }
          }
        } }
      }`;
    const data = await cfGraphQL<{ viewer: { accounts: { rumPageloadEventsAdaptiveGroups: { count: number; sum: { visits: number } }[] }[] } }>(
      token,
      query,
      { accountTag: accountId, since: isoDateTime(days), until: isoDateTime(0) }
    );
    for (const g of data.viewer.accounts[0]?.rumPageloadEventsAdaptiveGroups || []) {
      pageLoads += g.count;
      visits += g.sum?.visits ?? 0;
    }
  } catch (e) {
    console.warn('RUM page loads unavailable:', e instanceof Error ? e.message : e);
  }

  // Core Web Vitals percentiles (best-effort — field set varies by account).
  try {
    const query = `
      query ($accountTag: String!, $since: Time!, $until: Time!) {
        viewer { accounts(filter: { accountTag: $accountTag }) {
          rumPerformanceEventsAdaptiveGroups(limit: 1, filter: { datetime_geq: $since, datetime_leq: $until }) {
            quantiles { largestContentfulPaintPathP75 interactionToNextPaintPathP75 cumulativeLayoutShiftPathP75 }
          }
        } }
      }`;
    const data = await cfGraphQL<{ viewer: { accounts: { rumPerformanceEventsAdaptiveGroups: { quantiles: { largestContentfulPaintPathP75: number; interactionToNextPaintPathP75: number; cumulativeLayoutShiftPathP75: number } }[] }[] } }>(
      token,
      query,
      { accountTag: accountId, since: isoDateTime(days), until: isoDateTime(0) }
    );
    const q = data.viewer.accounts[0]?.rumPerformanceEventsAdaptiveGroups?.[0]?.quantiles;
    if (q) {
      vitals = {
        lcpP75: q.largestContentfulPaintPathP75 ?? null,
        inpP75: q.interactionToNextPaintPathP75 ?? null,
        clsP75: q.cumulativeLayoutShiftPathP75 ?? null
      };
    }
  } catch (e) {
    console.warn('RUM web vitals unavailable:', e instanceof Error ? e.message : e);
  }

  const result = { available: true, sites, pageLoads, visits, vitals };
  setCache(key, result);
  return json(result);
}

// ─── durable objects ──────────────────────────────────────────────

async function handleDurableObjects(token: string, url: URL, scope: string, skipCache: boolean) {
  const accountId = requireParam(url, 'accountId');
  const days = clampDays(url.searchParams.get('days'));
  const key = `durable-objects:${scope}:${accountId}:${days}`;
  if (!skipCache) {
    const cached = getCached(key);
    if (cached) return json(cached);
  }

  let requests: number | null = null;
  let responseBytes: number | null = null;
  let cpuTime: number | null = null;
  let storedBytes: number | null = null;
  let available = false;

  try {
    const query = `
      query ($accountTag: String!, $since: Date!) {
        viewer { accounts(filter: { accountTag: $accountTag }) {
          durableObjectsInvocationsAdaptiveGroups(limit: 10000, filter: { date_geq: $since }) {
            sum { requests responseBodySize errors }
          }
          durableObjectsPeriodicGroups(limit: 10000, filter: { date_geq: $since }) {
            sum { cpuTime activeTime }
          }
          durableObjectsStorageGroups(limit: 100, filter: { date_geq: $since }, orderBy: [date_DESC]) {
            max { storedBytes }
          }
        } }
      }`;
    const data = await cfGraphQL<{
      viewer: { accounts: { durableObjectsInvocationsAdaptiveGroups: { sum: { requests: number; responseBodySize: number; errors: number } }[]; durableObjectsPeriodicGroups: { sum: { cpuTime: number; activeTime: number } }[]; durableObjectsStorageGroups: { max: { storedBytes: number } }[] }[] };
    }>(token, query, { accountTag: accountId, since: isoDate(days - 1) });
    const acc = data.viewer.accounts[0];
    if (acc) {
      requests = (acc.durableObjectsInvocationsAdaptiveGroups || []).reduce((a, g) => a + (g.sum.requests || 0), 0);
      responseBytes = (acc.durableObjectsInvocationsAdaptiveGroups || []).reduce((a, g) => a + (g.sum.responseBodySize || 0), 0);
      cpuTime = (acc.durableObjectsPeriodicGroups || []).reduce((a, g) => a + (g.sum.cpuTime || 0), 0);
      storedBytes = acc.durableObjectsStorageGroups?.[0]?.max?.storedBytes ?? null;
      available = (acc.durableObjectsInvocationsAdaptiveGroups || []).length > 0 || (acc.durableObjectsStorageGroups || []).length > 0;
    }
  } catch (e) {
    console.warn('Durable Objects analytics unavailable:', e instanceof Error ? e.message : e);
  }

  const result = { available, requests, responseBytes, cpuTime, storedBytes };
  setCache(key, result);
  return json(result);
}

// ─── util ─────────────────────────────────────────────────────────

function requireParam(url: URL, name: string): string {
  const v = url.searchParams.get(name);
  if (!v) throw new Error(`Missing ${name} parameter`);
  return v;
}
