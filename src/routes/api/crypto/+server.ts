import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Server-side cache for crypto data
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

/** Build headers, including the Demo API key when available.
 *  Reads env at call-time so it works on Cloudflare Pages
 *  (env vars aren't available at module top-level there). */
function cgHeaders(): HeadersInit {
  const key = env.COINGECKO_API_KEY;
  if (key) {
    return { 'x-cg-demo-api-key': key };
  }
  return {};
}

export const GET: RequestHandler = async ({ url, locals }) => {
  // Require authentication
  const session = await locals.getSession();
  if (!session?.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  const action = url.searchParams.get('action');

  try {
    if (action === 'search') {
      return await handleSearch(url);
    } else if (action === 'chart') {
      return await handleChart(url);
    } else {
      return json({ error: 'Invalid action. Use: search, chart' }, { status: 400 });
    }
  } catch (error) {
    console.error('Crypto API error:', error);
    return json({ error: 'Failed to fetch crypto data' }, { status: 500 });
  }
};

/** Search for coins by name/symbol */
async function handleSearch(url: URL) {
  const query = url.searchParams.get('q');
  if (!query) {
    return json({ error: 'Missing search query (q)' }, { status: 400 });
  }

  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return json(cached);

  const res = await fetch(`${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`, {
    headers: cgHeaders()
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('CoinGecko search error:', res.status, text);
    return json({ error: 'CoinGecko API error' }, { status: res.status });
  }

  const data = await res.json();
  // Return top 8 coin results with only the fields we display
  const coins = (data.coins || []).slice(0, 8).map((coin: Record<string, unknown>) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol,
    thumb: coin.thumb,
    marketCapRank: coin.market_cap_rank
  }));

  const result = { coins };
  setCache(cacheKey, result);
  return json(result);
}

/** Get chart data (market_chart) — the only data endpoint needed.
 *  Returns prices array only. The widget derives current price,
 *  high/low, and change % directly from the price series. */
async function handleChart(url: URL) {
  const coinId = url.searchParams.get('coinId');
  const vsCurrency = url.searchParams.get('vs') || 'usd';
  const days = url.searchParams.get('days') || '7';

  if (!coinId) {
    return json({ error: 'Missing coinId parameter' }, { status: 400 });
  }

  const cacheKey = `chart:${coinId}:${vsCurrency}:${days}`;
  const cached = getCached(cacheKey);
  if (cached) return json(cached);

  const res = await fetch(
    `${COINGECKO_BASE}/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=${encodeURIComponent(vsCurrency)}&days=${encodeURIComponent(days)}&precision=2`,
    { headers: cgHeaders() }
  );
  if (!res.ok) {
    const text = await res.text();
    console.error('CoinGecko chart error:', res.status, text);
    return json({ error: 'CoinGecko API error' }, { status: res.status });
  }

  const data = await res.json();
  // Only return prices — marketCaps and totalVolumes are not displayed
  const result = {
    prices: data.prices || [] // [[timestamp, price], ...]
  };

  setCache(cacheKey, result);
  return json(result);
}
