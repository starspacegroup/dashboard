import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Server-side cache for analytics data
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Exchange a refresh token for a fresh access token using Google OAuth.
 */
async function getAccessTokenFromRefresh(refreshToken: string): Promise<string> {
  const clientId = env.GA_OAUTH_CLIENT_ID ?? '';
  const clientSecret = env.GA_OAUTH_CLIENT_SECRET ?? '';

  if (!clientId || !clientSecret) {
    throw new Error('GA_OAUTH_CLIENT_ID / GA_OAUTH_CLIENT_SECRET not configured on the server');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error('Token refresh failed:', res.status, errBody);
    throw new Error('Google token refresh failed. Try reconnecting your account.');
  }

  const data = (await res.json()) as { access_token: string; };
  return data.access_token;
}

// Available metrics the widget can display
const VALID_METRICS = [
  'sessions',
  'totalUsers',
  'newUsers',
  'activeUsers',
  'screenPageViews',
  'bounceRate',
  'averageSessionDuration',
  'engagedSessions',
  'engagementRate',
  'eventsPerSession',
  'sessionsPerUser',
  'conversions'
];

export const POST: RequestHandler = async ({ url, request, locals }) => {
  const session = await locals.auth();
  if (!session?.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  let refreshToken = '';
  try {
    const body = await request.json();
    refreshToken = body.refreshToken || '';
  } catch {
    // invalid body
  }

  if (!refreshToken) {
    return json({ error: 'Not connected. Open settings and connect your Google account.' }, { status: 400 });
  }

  const action = url.searchParams.get('action');
  const skipCache = url.searchParams.get('skipCache') === '1';

  try {
    const accessToken = await getAccessTokenFromRefresh(refreshToken);

    if (action === 'properties') {
      return await handleProperties(accessToken);
    } else if (action === 'report') {
      return await handleReport(url, skipCache, accessToken);
    } else if (action === 'realtime') {
      return await handleRealtime(url, accessToken);
    } else {
      return json({ error: 'Invalid action. Use: properties, report, realtime' }, { status: 400 });
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch analytics data';
    return json({ error: message }, { status: 500 });
  }
};

/** List all GA4 properties the user has access to via the Admin API. */
async function handleProperties(accessToken: string) {
  const cacheKey = `properties:${accessToken.slice(-8)}`;
  const cached = getCached(cacheKey);
  if (cached) return json(cached);

  // List all account summaries (includes properties) in a single call
  const res = await fetch(
    'https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const errBody = await res.text();
    console.error('GA4 accountSummaries error:', res.status, errBody);

    // Parse the Google error for a meaningful message
    let detail = `Failed to list properties (HTTP ${res.status})`;
    try {
      const errJson = JSON.parse(errBody);
      if (errJson?.error?.message) {
        detail = errJson.error.message;
      }
    } catch {
      // use default detail
    }

    return json({ error: detail }, { status: 502 });
  }

  interface PropertySummary {
    property: string; // "properties/123456789"
    displayName: string;
  }

  const data = (await res.json()) as {
    accountSummaries?: {
      name: string;
      displayName: string;
      propertySummaries?: PropertySummary[];
    }[];
  };

  interface PropertyInfo {
    propertyId: string;
    displayName: string;
    accountDisplayName: string;
  }

  const properties: PropertyInfo[] = [];

  for (const account of data.accountSummaries || []) {
    for (const prop of account.propertySummaries || []) {
      properties.push({
        propertyId: prop.property.replace('properties/', ''),
        displayName: prop.displayName,
        accountDisplayName: account.displayName
      });
    }
  }

  const result = { properties };
  setCache(cacheKey, result);
  return json(result);
}

/** Fetch a date-range report from GA4 Data API */
async function handleReport(url: URL, skipCache: boolean, accessToken: string) {
  const propertyId = url.searchParams.get('propertyId');
  const metricsParam = url.searchParams.get('metrics');
  const days = parseInt(url.searchParams.get('days') || '7', 10);

  if (!propertyId) {
    return json({ error: 'Missing propertyId parameter' }, { status: 400 });
  }

  const requestedMetrics = (metricsParam || 'sessions,totalUsers,screenPageViews')
    .split(',')
    .filter((m) => VALID_METRICS.includes(m));

  if (requestedMetrics.length === 0) {
    return json({ error: 'No valid metrics specified' }, { status: 400 });
  }

  const clampedDays = Math.min(Math.max(days, 1), 365);

  const cacheKey = `report:${propertyId}:${requestedMetrics.join(',')}:${clampedDays}`;
  if (!skipCache) {
    const cached = getCached(cacheKey);
    if (cached) return json(cached);
  }

  const endDate = 'yesterday';
  const startDate = `${clampedDays}daysAgo`;

  const body = {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }],
    metrics: requestedMetrics.map((m) => ({ name: m })),
    orderBys: [{ dimension: { dimensionName: 'date', orderType: 'ALPHANUMERIC' } }],
    keepEmptyRows: true
  };

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    console.error('GA4 report error:', res.status, errBody);
    return json({ error: `GA4 API error: ${res.status}` }, { status: 502 });
  }

  const raw = (await res.json()) as {
    rows?: { dimensionValues: { value: string; }[]; metricValues: { value: string; }[]; }[];
    metricHeaders?: { name: string; type: string; }[];
  };

  const metricNames = raw.metricHeaders?.map((h) => h.name) || requestedMetrics;
  const rows = (raw.rows || []).map((row) => {
    const dateStr = row.dimensionValues[0].value;
    const entry: Record<string, string | number> = {
      date: `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
    };
    metricNames.forEach((name, i) => {
      const val = row.metricValues[i]?.value || '0';
      entry[name] = val.includes('.') ? parseFloat(val) : parseInt(val, 10);
    });
    return entry;
  });

  const totals: Record<string, number> = {};
  const isRateMetric = (name: string) =>
    ['bounceRate', 'engagementRate', 'averageSessionDuration', 'eventsPerSession', 'sessionsPerUser'].includes(name);

  metricNames.forEach((name) => {
    const values = rows.map((r) => r[name] as number);
    if (isRateMetric(name)) {
      totals[name] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    } else {
      totals[name] = values.reduce((a, b) => a + b, 0);
    }
  });

  const result = { rows, totals, metrics: metricNames, days: clampedDays };
  setCache(cacheKey, result);
  return json(result);
}

/** Fetch realtime active users */
async function handleRealtime(url: URL, accessToken: string) {
  const propertyId = url.searchParams.get('propertyId');
  if (!propertyId) {
    return json({ error: 'Missing propertyId parameter' }, { status: 400 });
  }

  const cacheKey = `realtime:${propertyId}`;
  const cached = getCached(cacheKey);
  if (cached) return json(cached);

  const body = {
    metrics: [{ name: 'activeUsers' }]
  };

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runRealtimeReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    console.error('GA4 realtime error:', res.status, errBody);
    return json({ error: `GA4 API error: ${res.status}` }, { status: 502 });
  }

  const raw = (await res.json()) as {
    rows?: { metricValues: { value: string; }[]; }[];
  };

  const activeUsers = raw.rows?.[0]?.metricValues?.[0]?.value
    ? parseInt(raw.rows[0].metricValues[0].value, 10)
    : 0;

  const result = { activeUsers };
  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  return json(result);
}
