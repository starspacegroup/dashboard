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
 * Actions (via ?action=): verify, accounts, overview, zones, zone-analytics,
 * pages, workers.
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

// ─── zone analytics (GraphQL httpRequests1dGroups) ────────────────

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

async function handleZoneAnalytics(token: string, url: URL, scope: string, skipCache: boolean) {
  const zoneId = requireParam(url, 'zoneId');
  const days = clampDays(url.searchParams.get('days'));
  const key = `zone-analytics:${scope}:${zoneId}:${days}`;
  if (!skipCache) {
    const cached = getCached(key);
    if (cached) return json(cached);
  }
  const result = await fetchZoneSeries(token, zoneId, days);
  setCache(key, result);
  return json(result);
}

// ─── overview (account rollup) ────────────────────────────────────

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

  // Pages + Workers counts (best-effort; permissions may be absent)
  let pagesCount = 0;
  let workersCount = 0;
  try {
    const p = await cfFetch<{ name: string }[]>(token, `/accounts/${encodeURIComponent(accountId)}/pages/projects`);
    pagesCount = (p.result || []).length;
  } catch { /* pages permission missing */ }
  try {
    const w = await cfFetch<{ id: string }[]>(token, `/accounts/${encodeURIComponent(accountId)}/workers/scripts`);
    workersCount = (w.result || []).length;
  } catch { /* workers permission missing */ }

  const result = {
    zonesCount: zones.length,
    pagesCount,
    workersCount,
    totals,
    series
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
  const result = { projects };
  setCache(key, result);
  return json(result);
}

// ─── workers (scripts + invocation analytics) ─────────────────────

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
  const statsByName = new Map<string, { requests: number; errors: number; cpuP50: number; cpuP99: number }>();
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
      const prev = statsByName.get(g.dimensions.scriptName) || { requests: 0, errors: 0, cpuP50: 0, cpuP99: 0 };
      statsByName.set(g.dimensions.scriptName, {
        requests: prev.requests + g.sum.requests,
        errors: prev.errors + g.sum.errors,
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
      cpuP50: stats?.cpuP50 ?? null,
      cpuP99: stats?.cpuP99 ?? null
    };
  });

  // Sort by request volume (nulls last), then by most recently modified
  merged.sort((a, b) => {
    if (a.requests !== b.requests) return (b.requests ?? -1) - (a.requests ?? -1);
    return b.modifiedOn.localeCompare(a.modifiedOn);
  });

  const result = { scripts: merged, analyticsAvailable: statsByName.size > 0 };
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
  let namespaces: { id: string; title: string; keys: number | null; bytes: number | null }[] = [];
  const nsBody = await cfFetch<{ id: string; title: string }[]>(token, `/accounts/${encodeURIComponent(accountId)}/storage/kv/namespaces`);
  namespaces = (nsBody.result || []).map((n) => ({ id: n.id, title: n.title, keys: null, bytes: null }));

  // Operations by action type (best-effort — needs Account Analytics read)
  const ops = { read: 0, write: 0, delete: 0, list: 0, total: 0 };
  let analyticsAvailable = false;
  try {
    const data = await cfGraphQL<{ viewer: { accounts: { kvOperationsAdaptiveGroups: { dimensions: { actionType: string }; sum: { requests: number } }[] }[] } }>(
      token,
      `query ($accountTag: String!, $since: Date!, $until: Date!) {
        viewer { accounts(filter: { accountTag: $accountTag }) {
          kvOperationsAdaptiveGroups(limit: 10000, filter: { date_geq: $since, date_leq: $until }) {
            dimensions { actionType } sum { requests }
          } } } }`,
      { accountTag: accountId, since: isoDate(days - 1), until: isoDate(0) }
    );
    for (const g of data.viewer.accounts[0]?.kvOperationsAdaptiveGroups || []) {
      const t = g.dimensions.actionType.toLowerCase();
      if (t in ops) (ops as Record<string, number>)[t] += g.sum.requests;
      ops.total += g.sum.requests;
      analyticsAvailable = true;
    }
  } catch (e) {
    console.warn('KV operations unavailable:', e instanceof Error ? e.message : e);
  }

  // Storage per namespace (best-effort)
  const storage = { keys: 0, bytes: 0 };
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
    for (const ns of namespaces) {
      const s = byNs.get(ns.id);
      if (s) {
        ns.keys = s.keys;
        ns.bytes = s.bytes;
        storage.keys += s.keys;
        storage.bytes += s.bytes;
      }
    }
  } catch (e) {
    console.warn('KV storage unavailable:', e instanceof Error ? e.message : e);
  }

  const result = { namespaces, ops, storage, analyticsAvailable };
  setCache(key, result);
  return json(result);
}

// ─── R2 (buckets + operations + storage) ──────────────────────────

async function handleR2(token: string, url: URL, scope: string, skipCache: boolean) {
  const accountId = requireParam(url, 'accountId');
  const days = clampDays(url.searchParams.get('days'));
  const key = `r2:${scope}:${accountId}:${days}`;
  if (!skipCache) {
    const cached = getCached(key);
    if (cached) return json(cached);
  }

  // Buckets (REST) — result is { buckets: [...] }
  let buckets: { name: string; createdOn: string; objects: number | null; bytes: number | null }[] = [];
  const bBody = await cfFetch<{ buckets: { name: string; creation_date: string }[] }>(token, `/accounts/${encodeURIComponent(accountId)}/r2/buckets`);
  buckets = (bBody.result?.buckets || []).map((b) => ({ name: b.name, createdOn: b.creation_date, objects: null, bytes: null }));

  // Operations (Class A/B) by action type
  let requests = 0;
  let analyticsAvailable = false;
  try {
    const data = await cfGraphQL<{ viewer: { accounts: { r2OperationsAdaptiveGroups: { dimensions: { actionType: string }; sum: { requests: number } }[] }[] } }>(
      token,
      `query ($accountTag: String!, $since: Time!, $until: Time!) {
        viewer { accounts(filter: { accountTag: $accountTag }) {
          r2OperationsAdaptiveGroups(limit: 10000, filter: { datetime_geq: $since, datetime_leq: $until }) {
            dimensions { actionType } sum { requests }
          } } } }`,
      { accountTag: accountId, since: isoDateTime(days), until: isoDateTime(0) }
    );
    for (const g of data.viewer.accounts[0]?.r2OperationsAdaptiveGroups || []) {
      requests += g.sum.requests;
      analyticsAvailable = true;
    }
  } catch (e) {
    console.warn('R2 operations unavailable:', e instanceof Error ? e.message : e);
  }

  // Storage per bucket (latest snapshot in window)
  const storage = { objects: 0, bytes: 0 };
  try {
    const data = await cfGraphQL<{ viewer: { accounts: { r2StorageAdaptiveGroups: { dimensions: { bucketName: string }; max: { objectCount: number; payloadSize: number; metadataSize: number } }[] }[] } }>(
      token,
      `query ($accountTag: String!, $since: Time!, $until: Time!) {
        viewer { accounts(filter: { accountTag: $accountTag }) {
          r2StorageAdaptiveGroups(limit: 10000, filter: { datetime_geq: $since, datetime_leq: $until }, dimensions: { bucketName }, orderBy: [datetime_DESC]) {
            dimensions { bucketName } max { objectCount payloadSize metadataSize }
          } } } }`,
      { accountTag: accountId, since: isoDateTime(days), until: isoDateTime(0) }
    );
    const byBucket = new Map<string, { objects: number; bytes: number }>();
    for (const g of data.viewer.accounts[0]?.r2StorageAdaptiveGroups || []) {
      if (!byBucket.has(g.dimensions.bucketName)) {
        byBucket.set(g.dimensions.bucketName, { objects: g.max.objectCount, bytes: g.max.payloadSize + g.max.metadataSize });
      }
    }
    for (const bucket of buckets) {
      const s = byBucket.get(bucket.name);
      if (s) {
        bucket.objects = s.objects;
        bucket.bytes = s.bytes;
        storage.objects += s.objects;
        storage.bytes += s.bytes;
      }
    }
  } catch (e) {
    console.warn('R2 storage unavailable:', e instanceof Error ? e.message : e);
  }

  const result = { buckets, requests, storage, analyticsAvailable };
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
    rowsWritten: null as number | null
  }));

  const totals = { readQueries: 0, writeQueries: 0, rowsRead: 0, rowsWritten: 0 };
  let analyticsAvailable = false;
  try {
    const data = await cfGraphQL<{ viewer: { accounts: { d1AnalyticsAdaptiveGroups: { dimensions: { databaseId: string }; sum: { readQueries: number; writeQueries: number; rowsRead: number; rowsWritten: number } }[] }[] } }>(
      token,
      `query ($accountTag: String!, $since: Date!, $until: Date!) {
        viewer { accounts(filter: { accountTag: $accountTag }) {
          d1AnalyticsAdaptiveGroups(limit: 10000, filter: { date_geq: $since, date_leq: $until }, dimensions: { databaseId }) {
            dimensions { databaseId } sum { readQueries writeQueries rowsRead rowsWritten }
          } } } }`,
      { accountTag: accountId, since: isoDate(days - 1), until: isoDate(0) }
    );
    const byDb = new Map<string, { readQueries: number; writeQueries: number; rowsRead: number; rowsWritten: number }>();
    for (const g of data.viewer.accounts[0]?.d1AnalyticsAdaptiveGroups || []) {
      const prev = byDb.get(g.dimensions.databaseId) || { readQueries: 0, writeQueries: 0, rowsRead: 0, rowsWritten: 0 };
      byDb.set(g.dimensions.databaseId, {
        readQueries: prev.readQueries + g.sum.readQueries,
        writeQueries: prev.writeQueries + g.sum.writeQueries,
        rowsRead: prev.rowsRead + g.sum.rowsRead,
        rowsWritten: prev.rowsWritten + g.sum.rowsWritten
      });
      analyticsAvailable = true;
    }
    for (const db of databases) {
      const s = byDb.get(db.id);
      if (s) {
        db.readQueries = s.readQueries;
        db.writeQueries = s.writeQueries;
        db.rowsRead = s.rowsRead;
        db.rowsWritten = s.rowsWritten;
        totals.readQueries += s.readQueries;
        totals.writeQueries += s.writeQueries;
        totals.rowsRead += s.rowsRead;
        totals.rowsWritten += s.rowsWritten;
      }
    }
  } catch (e) {
    console.warn('D1 analytics unavailable:', e instanceof Error ? e.message : e);
  }

  const result = { databases, totals, analyticsAvailable };
  setCache(key, result);
  return json(result);
}

// ─── Queues (list) ────────────────────────────────────────────────

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
    name: q.queue_name || q.name || q.queue_id || 'queue',
    createdOn: q.created_on,
    producers: q.producers_total_count ?? 0,
    consumers: q.consumers_total_count ?? 0
  }));

  const result = { queues };
  setCache(key, result);
  return json(result);
}

// ─── util ─────────────────────────────────────────────────────────

function requireParam(url: URL, name: string): string {
  const v = url.searchParams.get(name);
  if (!v) throw new Error(`Missing ${name} parameter`);
  return v;
}
