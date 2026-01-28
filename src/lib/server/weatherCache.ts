/**
 * Server-side weather data cache with tiered TTL strategy
 * 
 * Cache tiers:
 * - Weather data: 10 minutes (Open-Meteo updates every 15 min anyway)
 * - Astronomical data: Until midnight local time (same all day)
 * - Location names: 24 hours (geocoding rarely changes)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface WeatherCacheData {
  temperature: number;
  humidity: number;
  dewPoint: number;
  pressure: number;
  pressureTrend: { direction: string; change: number; };
  windSpeed: number;
  windDirection: number;
  windGust: number;
  condition: string;
  description: string;
  icon: string;
  hourly: Array<{
    time: number;
    temperature: number;
    feelsLike: number;
    humidity: number;
    dewPoint: number;
    pressure: number;
    condition: string;
    icon: string;
  }>;
  timezone: string;
  timezoneOffset: number;
}

interface AstronomicalData {
  sunrise: number;
  sunset: number;
  solarNoon: number;
  dayLength: number;
  civilTwilightBegin: number;
  civilTwilightEnd: number;
  nauticalTwilightBegin: number;
  nauticalTwilightEnd: number;
  astronomicalTwilightBegin: number;
  astronomicalTwilightEnd: number;
  moonPhase: number;
  moonIllumination: number;
  moonrise: number;
  moonset: number;
}

// In-memory caches with different TTLs
const weatherCache = new Map<string, CacheEntry<WeatherCacheData>>();
const astronomicalCache = new Map<string, CacheEntry<AstronomicalData>>();
const locationCache = new Map<string, CacheEntry<string>>();

// TTL constants in milliseconds
const WEATHER_TTL = 10 * 60 * 1000; // 10 minutes
const LOCATION_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Maximum cache sizes to prevent memory leaks
const MAX_CACHE_SIZE = 1000;

/**
 * Generate a cache key from coordinates (rounded to 2 decimal places for proximity grouping)
 */
export function getCacheKey(lat: number | string, lon: number | string): string {
  const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
  const lonNum = typeof lon === 'string' ? parseFloat(lon) : lon;
  // Round to 2 decimal places (~1.1km precision) - close enough for weather
  return `${latNum.toFixed(2)},${lonNum.toFixed(2)}`;
}

/**
 * Generate a date-specific cache key for astronomical data
 */
export function getAstroCacheKey(lat: number | string, lon: number | string, date: Date): string {
  const baseKey = getCacheKey(lat, lon);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${baseKey}:${dateStr}`;
}

/**
 * Check if a cache entry is still valid
 */
function isValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() < entry.expiresAt;
}

/**
 * Evict oldest entries if cache exceeds max size
 */
function evictIfNeeded<T>(cache: Map<string, CacheEntry<T>>): void {
  if (cache.size <= MAX_CACHE_SIZE) return;

  // Sort entries by timestamp and remove oldest 10%
  const entries = Array.from(cache.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp);

  const toRemove = Math.floor(cache.size * 0.1);
  for (let i = 0; i < toRemove; i++) {
    cache.delete(entries[i][0]);
  }
}

// ========== Weather Data Cache ==========

export function getWeatherFromCache(lat: number | string, lon: number | string): WeatherCacheData | null {
  const key = getCacheKey(lat, lon);
  const entry = weatherCache.get(key);

  if (isValid(entry)) {
    return entry.data;
  }

  // Clean up expired entry
  if (entry) {
    weatherCache.delete(key);
  }

  return null;
}

export function setWeatherCache(lat: number | string, lon: number | string, data: WeatherCacheData): void {
  evictIfNeeded(weatherCache);

  const key = getCacheKey(lat, lon);
  weatherCache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + WEATHER_TTL
  });
}

export function getWeatherCacheInfo(lat: number | string, lon: number | string): { cached: boolean; age: number; ttl: number; } | null {
  const key = getCacheKey(lat, lon);
  const entry = weatherCache.get(key);

  if (isValid(entry)) {
    const age = Date.now() - entry.timestamp;
    const ttl = entry.expiresAt - Date.now();
    return { cached: true, age, ttl };
  }

  return null;
}

// ========== Astronomical Data Cache ==========

export function getAstronomicalFromCache(lat: number | string, lon: number | string, date: Date): AstronomicalData | null {
  const key = getAstroCacheKey(lat, lon, date);
  const entry = astronomicalCache.get(key);

  if (isValid(entry)) {
    return entry.data;
  }

  // Clean up expired entry
  if (entry) {
    astronomicalCache.delete(key);
  }

  return null;
}

export function setAstronomicalCache(lat: number | string, lon: number | string, date: Date, data: AstronomicalData, timezone?: string): void {
  evictIfNeeded(astronomicalCache);

  const key = getAstroCacheKey(lat, lon, date);

  // Calculate expiration at midnight local time (or 24h if no timezone)
  let expiresAt: number;
  if (timezone) {
    try {
      // Calculate time until midnight in that timezone
      // For simplicity, we just set it to expire at the end of the current calendar day
      const midnightTomorrow = new Date(date);
      midnightTomorrow.setHours(24, 0, 0, 0);

      expiresAt = Math.min(Date.now() + 24 * 60 * 60 * 1000, midnightTomorrow.getTime());
    } catch {
      // Fallback to 24 hours
      expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    }
  } else {
    // Default to end of current UTC day
    const tomorrow = new Date(date);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    expiresAt = tomorrow.getTime();
  }

  astronomicalCache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt
  });
}

// ========== Location Name Cache ==========

export function getLocationFromCache(lat: number | string, lon: number | string): string | null {
  const key = getCacheKey(lat, lon);
  const entry = locationCache.get(key);

  if (isValid(entry)) {
    return entry.data;
  }

  // Clean up expired entry
  if (entry) {
    locationCache.delete(key);
  }

  return null;
}

export function setLocationCache(lat: number | string, lon: number | string, locationName: string): void {
  evictIfNeeded(locationCache);

  const key = getCacheKey(lat, lon);
  locationCache.set(key, {
    data: locationName,
    timestamp: Date.now(),
    expiresAt: Date.now() + LOCATION_TTL
  });
}

// ========== Cache Statistics ==========

export function getCacheStats(): {
  weather: { size: number; ttl: string; };
  astronomical: { size: number; ttl: string; };
  location: { size: number; ttl: string; };
} {
  return {
    weather: { size: weatherCache.size, ttl: '10 minutes' },
    astronomical: { size: astronomicalCache.size, ttl: 'Until midnight' },
    location: { size: locationCache.size, ttl: '24 hours' }
  };
}

/**
 * Clear all caches (useful for testing or forced refresh)
 */
export function clearAllCaches(): void {
  weatherCache.clear();
  astronomicalCache.clear();
  locationCache.clear();
}

/**
 * Clear weather cache for a specific location (for forced refresh)
 */
export function clearWeatherCache(lat: number | string, lon: number | string): void {
  const key = getCacheKey(lat, lon);
  weatherCache.delete(key);
}
