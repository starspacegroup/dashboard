import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  getWeatherFromCache,
  setWeatherCache,
  getAstronomicalFromCache,
  setAstronomicalCache,
  getLocationFromCache,
  setLocationCache,
  getWeatherCacheInfo
} from '$lib/server/weatherCache';

// WMO Weather interpretation codes mapping to conditions and icons
// See: https://open-meteo.com/en/docs#weathervariables
const WMO_CODES: Record<number, { condition: string; icon: string; description: string; }> = {
  0: { condition: 'clear', icon: '01d', description: 'Clear sky' },
  1: { condition: 'clear', icon: '01d', description: 'Mainly clear' },
  2: { condition: 'clouds', icon: '02d', description: 'Partly cloudy' },
  3: { condition: 'clouds', icon: '03d', description: 'Overcast' },
  45: { condition: 'fog', icon: '50d', description: 'Fog' },
  48: { condition: 'fog', icon: '50d', description: 'Depositing rime fog' },
  51: { condition: 'drizzle', icon: '09d', description: 'Light drizzle' },
  53: { condition: 'drizzle', icon: '09d', description: 'Moderate drizzle' },
  55: { condition: 'drizzle', icon: '09d', description: 'Dense drizzle' },
  56: { condition: 'drizzle', icon: '09d', description: 'Light freezing drizzle' },
  57: { condition: 'drizzle', icon: '09d', description: 'Dense freezing drizzle' },
  61: { condition: 'rain', icon: '10d', description: 'Slight rain' },
  63: { condition: 'rain', icon: '10d', description: 'Moderate rain' },
  65: { condition: 'rain', icon: '10d', description: 'Heavy rain' },
  66: { condition: 'rain', icon: '13d', description: 'Light freezing rain' },
  67: { condition: 'rain', icon: '13d', description: 'Heavy freezing rain' },
  71: { condition: 'snow', icon: '13d', description: 'Slight snow fall' },
  73: { condition: 'snow', icon: '13d', description: 'Moderate snow fall' },
  75: { condition: 'snow', icon: '13d', description: 'Heavy snow fall' },
  77: { condition: 'snow', icon: '13d', description: 'Snow grains' },
  80: { condition: 'rain', icon: '09d', description: 'Slight rain showers' },
  81: { condition: 'rain', icon: '09d', description: 'Moderate rain showers' },
  82: { condition: 'rain', icon: '09d', description: 'Violent rain showers' },
  85: { condition: 'snow', icon: '13d', description: 'Slight snow showers' },
  86: { condition: 'snow', icon: '13d', description: 'Heavy snow showers' },
  95: { condition: 'thunderstorm', icon: '11d', description: 'Thunderstorm' },
  96: { condition: 'thunderstorm', icon: '11d', description: 'Thunderstorm with slight hail' },
  99: { condition: 'thunderstorm', icon: '11d', description: 'Thunderstorm with heavy hail' }
};

// Get weather info from WMO code
function getWeatherFromWMO(code: number, isNight: boolean = false): { condition: string; icon: string; description: string; } {
  const weather = WMO_CODES[code] || { condition: 'clear', icon: '01d', description: 'Unknown' };
  // Replace 'd' with 'n' for night icons
  const icon = isNight ? weather.icon.replace('d', 'n') : weather.icon;
  return { ...weather, icon };
}

export const GET: RequestHandler = async ({ url, locals }) => {
  // Require authentication
  const session = await locals.getSession();
  if (!session?.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  const zip = url.searchParams.get('zip');

  try {
    let latitude: string;
    let longitude: string;

    if (zip) {
      // Convert zip code to coordinates using Open-Meteo geocoding
      const coords = await getCoordinatesFromZip(zip);
      if (!coords) {
        return json(
          { error: 'Invalid zip code or unable to geocode' },
          { status: 400 }
        );
      }
      latitude = coords.lat;
      longitude = coords.lon;
    } else if (lat && lon) {
      latitude = lat;
      longitude = lon;
    } else {
      // Default to Lewiston, ME coordinates
      latitude = '44.1004';
      longitude = '-70.2148';
    }

    const now = new Date();
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    // Check if we have cached weather data (unless force refresh)
    const cachedWeather = forceRefresh ? null : getWeatherFromCache(latitude, longitude);
    const cacheInfo = getWeatherCacheInfo(latitude, longitude);

    // If we have valid cached weather data, try to use cached location and astro data too
    if (cachedWeather) {
      // Get cached or fresh location name
      let locationName = getLocationFromCache(latitude, longitude);
      if (!locationName) {
        try {
          locationName = await getLocationName(latitude, longitude);
          setLocationCache(latitude, longitude, locationName);
        } catch {
          locationName = 'Unknown Location';
        }
      }

      // Get cached or fresh astronomical data
      let astroData = getAstronomicalFromCache(latitude, longitude, now);
      if (!astroData) {
        try {
          astroData = await fetchAstronomicalData(parseFloat(latitude), parseFloat(longitude), now);
          setAstronomicalCache(latitude, longitude, now, astroData, cachedWeather.timezone);
        } catch {
          // Use default values if astronomical fetch fails
          const midnightTs = Math.floor(now.getTime() / 1000);
          astroData = {
            sunrise: midnightTs + 6 * 3600,
            sunset: midnightTs + 18 * 3600,
            solarNoon: midnightTs + 12 * 3600,
            dayLength: 12 * 3600,
            civilTwilightBegin: midnightTs + 5.5 * 3600,
            civilTwilightEnd: midnightTs + 18.5 * 3600,
            nauticalTwilightBegin: midnightTs + 5 * 3600,
            nauticalTwilightEnd: midnightTs + 19 * 3600,
            astronomicalTwilightBegin: midnightTs + 4.5 * 3600,
            astronomicalTwilightEnd: midnightTs + 19.5 * 3600,
            moonPhase: 0.5,
            moonIllumination: 0.5,
            moonrise: midnightTs + 20 * 3600,
            moonset: midnightTs + 8 * 3600
          };
        }
      }

      // Return cached response with merged data
      const weatherData = {
        ...cachedWeather,
        location: locationName,
        sunrise: astroData.sunrise,
        sunset: astroData.sunset,
        solarNoon: astroData.solarNoon,
        dayLength: astroData.dayLength,
        civilTwilightBegin: astroData.civilTwilightBegin,
        civilTwilightEnd: astroData.civilTwilightEnd,
        nauticalTwilightBegin: astroData.nauticalTwilightBegin,
        nauticalTwilightEnd: astroData.nauticalTwilightEnd,
        astronomicalTwilightBegin: astroData.astronomicalTwilightBegin,
        astronomicalTwilightEnd: astroData.astronomicalTwilightEnd,
        moonrise: astroData.moonrise,
        moonset: astroData.moonset,
        moonPhase: astroData.moonPhase,
        moonIllumination: astroData.moonIllumination,
        timestamp: Date.now(),
        cached: true,
        cacheAge: cacheInfo?.age || 0
      };

      return json(weatherData);
    }

    // Fetch fresh weather data from Open-Meteo
    // Using Fahrenheit (temperature_unit=fahrenheit) for consistency with existing code
    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
    forecastUrl.searchParams.set('latitude', latitude);
    forecastUrl.searchParams.set('longitude', longitude);
    forecastUrl.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m');
    forecastUrl.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,weather_code,is_day,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m');
    forecastUrl.searchParams.set('daily', 'sunrise,sunset');
    forecastUrl.searchParams.set('temperature_unit', 'fahrenheit');
    forecastUrl.searchParams.set('wind_speed_unit', 'mph');
    forecastUrl.searchParams.set('timezone', 'auto');
    forecastUrl.searchParams.set('past_days', '1');
    forecastUrl.searchParams.set('forecast_days', '2');

    let response: Response;
    try {
      response = await fetch(forecastUrl.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'StarspaceDashboard/1.0'
        }
      });
    } catch (fetchError) {
      console.error('Open-Meteo fetch error:', fetchError);
      return json(
        { error: `Failed to connect to Open-Meteo: ${fetchError instanceof Error ? fetchError.message : 'Network error'}` },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Open-Meteo API error:', response.status, errorText);
      return json(
        { error: `Open-Meteo API error (${response.status}): ${errorText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Open-Meteo JSON parse error:', parseError);
      return json(
        { error: 'Failed to parse Open-Meteo response' },
        { status: 502 }
      );
    }

    // Get current time index in the hourly arrays
    const currentHourISO = now.toISOString().slice(0, 13) + ':00';

    // Current weather data
    const isNight = data.current.is_day === 0;
    const weatherInfo = getWeatherFromWMO(data.current.weather_code, isNight);

    // Calculate dew point from current conditions (Open-Meteo doesn't provide it in current)
    // Using Magnus formula approximation: Td ≈ T - ((100 - RH) / 5) for quick estimate
    const currentTemp = data.current.temperature_2m;
    const currentHumidity = data.current.relative_humidity_2m;
    const dewPointEstimate = currentTemp - ((100 - currentHumidity) / 5);

    // Get current pressure (in hPa/mbar)
    const currentPressure = data.current.surface_pressure;

    // Get current wind data
    const windSpeed = data.current.wind_speed_10m; // mph
    const windDirection = data.current.wind_direction_10m; // degrees (0=N, 90=E, 180=S, 270=W)
    const windGust = data.current.wind_gusts_10m; // mph

    // Calculate pressure trend from last 3 hours of hourly data
    const pressureTrend = calculatePressureTrend(data.hourly.time, data.hourly.surface_pressure);

    // Process hourly data - combine past and future
    const hourlyData = [];
    const nowTimestamp = Math.floor(Date.now() / 1000);

    for (let i = 0; i < data.hourly.time.length; i++) {
      const hourTime = new Date(data.hourly.time[i]).getTime() / 1000;
      // Include 24 hours back and 24 hours forward
      if (hourTime >= nowTimestamp - 24 * 3600 && hourTime <= nowTimestamp + 24 * 3600) {
        const hourIsNight = data.hourly.is_day[i] === 0;
        const hourWeather = getWeatherFromWMO(data.hourly.weather_code[i], hourIsNight);

        hourlyData.push({
          time: hourTime,
          temperature: Math.round(data.hourly.temperature_2m[i]),
          feelsLike: Math.round(data.hourly.apparent_temperature[i]),
          humidity: data.hourly.relative_humidity_2m[i],
          dewPoint: Math.round(data.hourly.dew_point_2m[i]),
          pressure: Math.round(data.hourly.surface_pressure[i] * 10) / 10,
          condition: hourWeather.condition,
          icon: hourWeather.icon
        });
      }
    }

    // Sort by time
    hourlyData.sort((a, b) => a.time - b.time);

    // Interpolate to 30-minute resolution
    const interpolatedHourly = interpolateToHalfHour(hourlyData);

    // Get timezone offset in seconds
    const timezoneOffset = getTimezoneOffset(data.timezone);

    // Get current feels-like temperature
    const currentFeelsLike = Math.round(data.current.apparent_temperature);

    // Cache the core weather data (before adding location/astro)
    const weatherCacheData = {
      temperature: Math.round(currentTemp),
      feelsLike: currentFeelsLike,
      humidity: currentHumidity,
      dewPoint: Math.round(dewPointEstimate),
      pressure: Math.round(currentPressure * 10) / 10,
      pressureTrend: pressureTrend,
      windSpeed: Math.round(windSpeed),
      windDirection: Math.round(windDirection),
      windGust: Math.round(windGust),
      condition: weatherInfo.condition,
      description: weatherInfo.description,
      icon: weatherInfo.icon,
      hourly: interpolatedHourly,
      timezone: data.timezone,
      timezoneOffset: timezoneOffset
    };
    setWeatherCache(latitude, longitude, weatherCacheData);

    // Get cached or fresh astronomical data
    let astroData = getAstronomicalFromCache(latitude, longitude, now);
    if (!astroData) {
      try {
        astroData = await fetchAstronomicalData(parseFloat(latitude), parseFloat(longitude), now);
        setAstronomicalCache(latitude, longitude, now, astroData, data.timezone);
      } catch (astroError) {
        console.error('Astronomical data fetch error:', astroError);
        // Use default values if astronomical fetch fails
        const midnightTs = Math.floor(now.getTime() / 1000);
        astroData = {
          sunrise: midnightTs + 6 * 3600,
          sunset: midnightTs + 18 * 3600,
          solarNoon: midnightTs + 12 * 3600,
          dayLength: 12 * 3600,
          civilTwilightBegin: midnightTs + 5.5 * 3600,
          civilTwilightEnd: midnightTs + 18.5 * 3600,
          nauticalTwilightBegin: midnightTs + 5 * 3600,
          nauticalTwilightEnd: midnightTs + 19 * 3600,
          astronomicalTwilightBegin: midnightTs + 4.5 * 3600,
          astronomicalTwilightEnd: midnightTs + 19.5 * 3600,
          moonPhase: 0.5,
          moonIllumination: 0.5,
          moonrise: midnightTs + 20 * 3600,
          moonset: midnightTs + 8 * 3600
        };
      }
    }

    // Get cached or fresh location name
    let locationName = getLocationFromCache(latitude, longitude);
    if (!locationName) {
      try {
        locationName = await getLocationName(latitude, longitude);
        setLocationCache(latitude, longitude, locationName);
      } catch (locationError) {
        console.error('Location name fetch error:', locationError);
        locationName = 'Unknown Location';
      }
    }

    const weatherData = {
      ...weatherCacheData,
      location: locationName,
      sunrise: astroData.sunrise,
      sunset: astroData.sunset,
      solarNoon: astroData.solarNoon,
      dayLength: astroData.dayLength,
      civilTwilightBegin: astroData.civilTwilightBegin,
      civilTwilightEnd: astroData.civilTwilightEnd,
      nauticalTwilightBegin: astroData.nauticalTwilightBegin,
      nauticalTwilightEnd: astroData.nauticalTwilightEnd,
      astronomicalTwilightBegin: astroData.astronomicalTwilightBegin,
      astronomicalTwilightEnd: astroData.astronomicalTwilightEnd,
      moonrise: astroData.moonrise,
      moonset: astroData.moonset,
      moonPhase: astroData.moonPhase,
      moonIllumination: astroData.moonIllumination,
      timestamp: Date.now(),
      cached: false
    };

    return json(weatherData);
  } catch (error) {
    console.error('Error fetching weather:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return json(
      { error: `Weather API error: ${errorMessage}` },
      { status: 500 }
    );
  }
};

// Calculate pressure trend from hourly data
// Returns: 'rising', 'falling', 'steady', or 'rapidly-rising', 'rapidly-falling'
function calculatePressureTrend(times: string[], pressures: number[]): { direction: string; change: number; } {
  const now = Date.now();

  // Find the index of the most recent hour (closest to now but not in the future)
  let currentIndex = -1;
  for (let i = 0; i < times.length; i++) {
    const time = new Date(times[i]).getTime();
    if (time <= now) {
      currentIndex = i;
    } else {
      break; // Times are sorted, so we can stop once we hit future times
    }
  }

  // Need at least 4 hours of data (current + 3 hours back)
  if (currentIndex < 3 || currentIndex >= pressures.length) {
    return { direction: 'steady', change: 0 };
  }

  // Get pressure from 3 hours ago and now using array indices
  // This is more reliable than trying to match exact timestamps
  const newestPressure = pressures[currentIndex];
  const oldestPressure = pressures[currentIndex - 3];

  if (newestPressure === undefined || oldestPressure === undefined) {
    return { direction: 'steady', change: 0 };
  }

  // Calculate change in hPa over the period
  const change = newestPressure - oldestPressure;
  const changeRounded = Math.round(change * 10) / 10;

  // Thresholds for pressure trends (in hPa over 3 hours)
  // Rapid change: > 2 hPa/3hr
  // Normal change: 0.5-2 hPa/3hr
  // Steady: < 0.5 hPa/3hr
  let direction: string;

  if (change > 2) {
    direction = 'rapidly-rising';
  } else if (change > 0.5) {
    direction = 'rising';
  } else if (change < -2) {
    direction = 'rapidly-falling';
  } else if (change < -0.5) {
    direction = 'falling';
  } else {
    direction = 'steady';
  }

  return { direction, change: changeRounded };
}

// Interpolate hourly data to 30-minute resolution
function interpolateToHalfHour(hourlyData: any[]): any[] {
  if (hourlyData.length < 2) return hourlyData;

  const interpolated: any[] = [];

  for (let i = 0; i < hourlyData.length; i++) {
    const current = hourlyData[i];
    interpolated.push(current);

    // If there's a next hour, add an interpolated point at 30 minutes
    if (i < hourlyData.length - 1) {
      const next = hourlyData[i + 1];
      const timeDiff = next.time - current.time;

      // Only interpolate if the gap is roughly 1 hour (between 50-70 minutes)
      if (timeDiff >= 3000 && timeDiff <= 4200) {
        const midTime = current.time + Math.floor(timeDiff / 2);

        interpolated.push({
          time: midTime,
          temperature: Math.round((current.temperature + next.temperature) / 2),
          feelsLike: Math.round((current.feelsLike + next.feelsLike) / 2),
          humidity: Math.round((current.humidity + next.humidity) / 2),
          dewPoint: Math.round((current.dewPoint + next.dewPoint) / 2),
          pressure: Math.round(((current.pressure || 0) + (next.pressure || 0)) / 2 * 10) / 10,
          condition: current.condition, // Keep the earlier condition
          icon: current.icon,
          interpolated: true // Mark as interpolated
        });
      }
    }
  }

  return interpolated;
}

// Get timezone offset in seconds from IANA timezone string
function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const targetTime = new Date(utcTime).toLocaleString('en-US', { timeZone: timezone });
    const targetDate = new Date(targetTime);
    const diff = targetDate.getTime() - utcTime;
    return Math.round(diff / 1000);
  } catch {
    return 0;
  }
}

// Fetch astronomical data from free APIs
// Uses api.sunrise-sunset.org for sun times and calculates moon data
async function fetchAstronomicalData(lat: number, lon: number, date: Date): Promise<{
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
}> {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Fetch sun data from sunrise-sunset.org (free, no API key required)
  const sunUrl = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${dateStr}&formatted=0`;

  let sunData = {
    sunrise: 0,
    sunset: 0,
    solarNoon: 0,
    dayLength: 0,
    civilTwilightBegin: 0,
    civilTwilightEnd: 0,
    nauticalTwilightBegin: 0,
    nauticalTwilightEnd: 0,
    astronomicalTwilightBegin: 0,
    astronomicalTwilightEnd: 0
  };

  try {
    const response = await fetch(sunUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'OK' && data.results) {
        const r = data.results;
        sunData = {
          sunrise: new Date(r.sunrise).getTime() / 1000,
          sunset: new Date(r.sunset).getTime() / 1000,
          solarNoon: new Date(r.solar_noon).getTime() / 1000,
          dayLength: r.day_length,
          civilTwilightBegin: new Date(r.civil_twilight_begin).getTime() / 1000,
          civilTwilightEnd: new Date(r.civil_twilight_end).getTime() / 1000,
          nauticalTwilightBegin: new Date(r.nautical_twilight_begin).getTime() / 1000,
          nauticalTwilightEnd: new Date(r.nautical_twilight_end).getTime() / 1000,
          astronomicalTwilightBegin: new Date(r.astronomical_twilight_begin).getTime() / 1000,
          astronomicalTwilightEnd: new Date(r.astronomical_twilight_end).getTime() / 1000
        };
      }
    }
  } catch (error) {
    console.error('Error fetching sun data:', error);
  }

  // Calculate moon data using accurate astronomical algorithms
  const moonData = calculateMoonData(lat, lon, date);

  return {
    ...sunData,
    moonPhase: moonData.phase,
    moonIllumination: moonData.illumination,
    moonrise: moonData.moonrise,
    moonset: moonData.moonset
  };
}

// Calculate moon phase and rise/set times using astronomical algorithms
// Based on SunCalc algorithms (https://github.com/mourner/suncalc)
function calculateMoonData(lat: number, lon: number, date: Date): {
  phase: number;
  illumination: number;
  moonrise: number;
  moonset: number;
} {
  const RAD = Math.PI / 180;
  const DAY_MS = 1000 * 60 * 60 * 24;
  const J1970 = 2440588;
  const J2000 = 2451545;

  function toJulian(date: Date): number {
    return date.valueOf() / DAY_MS - 0.5 + J1970;
  }

  function fromJulian(j: number): Date {
    return new Date((j + 0.5 - J1970) * DAY_MS);
  }

  function toDays(date: Date): number {
    return toJulian(date) - J2000;
  }

  // Moon calculations
  function getMoonPosition(date: Date, lat: number, lon: number) {
    const d = toDays(date);
    const L = RAD * (218.316 + 13.176396 * d); // ecliptic longitude
    const M = RAD * (134.963 + 13.064993 * d); // mean anomaly
    const F = RAD * (93.272 + 13.229350 * d);  // mean distance

    const l = L + RAD * 6.289 * Math.sin(M); // longitude
    const b = RAD * 5.128 * Math.sin(F);     // latitude
    const dt = 385001 - 20905 * Math.cos(M); // distance to the moon in km

    const ra = Math.atan2(
      Math.sin(l) * Math.cos(RAD * 23.4397) - Math.tan(b) * Math.sin(RAD * 23.4397),
      Math.cos(l)
    );
    const dec = Math.asin(
      Math.sin(b) * Math.cos(RAD * 23.4397) +
      Math.cos(b) * Math.sin(RAD * 23.4397) * Math.sin(l)
    );

    // Calculate altitude
    const lw = RAD * -lon;
    const phi = RAD * lat;
    const H = siderealTime(d, lw) - ra;
    const altitude = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));

    return { ra, dec, dist: dt, altitude };
  }

  function siderealTime(d: number, lw: number): number {
    return RAD * (280.16 + 360.9856235 * d) - lw;
  }

  // Moon illumination calculations
  function getMoonIllumination(date: Date) {
    const d = toDays(date);
    const s = getSunCoords(d);
    const m = getMoonCoords(d);

    const sdist = 149598000; // distance from Earth to Sun in km

    const phi = Math.acos(
      Math.sin(s.dec) * Math.sin(m.dec) +
      Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra)
    );
    const inc = Math.atan2(sdist * Math.sin(phi), m.dist - sdist * Math.cos(phi));
    const angle = Math.atan2(
      Math.cos(s.dec) * Math.sin(s.ra - m.ra),
      Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra)
    );

    const fraction = (1 + Math.cos(inc)) / 2;
    const phase = 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI;

    return { fraction, phase, angle };
  }

  function getSunCoords(d: number) {
    const M = RAD * (357.5291 + 0.98560028 * d);
    const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    const L = RAD * (280.46646 + 0.98564736 * d) + C;

    const dec = Math.asin(Math.sin(L) * Math.sin(RAD * 23.4397));
    const ra = Math.atan2(Math.sin(L) * Math.cos(RAD * 23.4397), Math.cos(L));

    return { dec, ra };
  }

  function getMoonCoords(d: number) {
    const L = RAD * (218.316 + 13.176396 * d);
    const M = RAD * (134.963 + 13.064993 * d);
    const F = RAD * (93.272 + 13.229350 * d);

    const l = L + RAD * 6.289 * Math.sin(M);
    const b = RAD * 5.128 * Math.sin(F);
    const dt = 385001 - 20905 * Math.cos(M);

    const dec = Math.asin(
      Math.sin(b) * Math.cos(RAD * 23.4397) +
      Math.cos(b) * Math.sin(RAD * 23.4397) * Math.sin(l)
    );
    const ra = Math.atan2(
      Math.sin(l) * Math.cos(RAD * 23.4397) - Math.tan(b) * Math.sin(RAD * 23.4397),
      Math.cos(l)
    );

    return { ra, dec, dist: dt };
  }

  // Calculate moonrise and moonset times
  function getMoonTimes(date: Date, lat: number, lon: number): { rise: number | null; set: number | null; } {
    const midnight = new Date(date);
    midnight.setHours(0, 0, 0, 0);

    const hc = 0.133 * RAD; // Moon's apparent radius
    let h0 = getMoonPosition(midnight, lat, lon).altitude - hc;

    let rise: number | null = null;
    let set: number | null = null;

    // Search in 2-hour chunks
    for (let i = 1; i <= 24; i += 2) {
      const h1 = getMoonPosition(new Date(midnight.getTime() + i * 3600000), lat, lon).altitude - hc;
      const h2 = getMoonPosition(new Date(midnight.getTime() + (i + 1) * 3600000), lat, lon).altitude - hc;

      const a = (h0 + h2) / 2 - h1;
      const b = (h2 - h0) / 2;
      const xe = -b / (2 * a);
      const ye = (a * xe + b) * xe + h1;
      const d = b * b - 4 * a * h1;
      let roots = 0;
      let x1 = 0, x2 = 0;

      if (d >= 0) {
        const dx = Math.sqrt(d) / (Math.abs(a) * 2);
        x1 = xe - dx;
        x2 = xe + dx;
        if (Math.abs(x1) <= 1) roots++;
        if (Math.abs(x2) <= 1) roots++;
        if (x1 < -1) x1 = x2;
      }

      if (roots === 1) {
        if (h0 < 0 && rise === null) rise = (i + x1) * 3600;
        else if (set === null) set = (i + x1) * 3600;
      } else if (roots === 2) {
        if (rise === null) rise = (i + (ye < 0 ? x2 : x1)) * 3600;
        if (set === null) set = (i + (ye < 0 ? x1 : x2)) * 3600;
      }

      if (rise !== null && set !== null) break;

      h0 = h2;
    }

    const midnightTs = midnight.getTime() / 1000;
    return {
      rise: rise !== null ? midnightTs + rise : null,
      set: set !== null ? midnightTs + set : null
    };
  }

  const illumination = getMoonIllumination(date);
  const times = getMoonTimes(date, lat, lon);

  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  const midnightTs = midnight.getTime() / 1000;

  return {
    phase: illumination.phase,
    illumination: illumination.fraction,
    moonrise: times.rise ?? midnightTs + illumination.phase * 24 * 3600,
    moonset: times.set ?? (times.rise ? times.rise + 12 * 3600 : midnightTs + 12 * 3600)
  };
}

// Convert zip code to coordinates using Open-Meteo geocoding
async function getCoordinatesFromZip(zip: string): Promise<{ lat: string; lon: string; } | null> {
  try {
    // Open-Meteo geocoding search - search for the zip code as a place name
    // This works well for US zip codes when combined with "USA"
    const searchQuery = `${zip} USA`;
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=en&format=json`;

    const response = await fetch(geoUrl);

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return {
          lat: data.results[0].latitude.toString(),
          lon: data.results[0].longitude.toString()
        };
      }
    }

    // Fallback: try searching just the zip code
    const fallbackUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(zip)}&count=1&language=en&format=json`;
    const fallbackResponse = await fetch(fallbackUrl);

    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      if (fallbackData.results && fallbackData.results.length > 0) {
        return {
          lat: fallbackData.results[0].latitude.toString(),
          lon: fallbackData.results[0].longitude.toString()
        };
      }
    }
  } catch (error) {
    console.error('Error geocoding zip code:', error);
  }

  return null;
}

// US state name to abbreviation mapping
const US_STATE_ABBREVIATIONS: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
  'District of Columbia': 'DC'
};

// Get location name from coordinates using Open-Meteo reverse geocoding
async function getLocationName(lat: string, lon: string): Promise<string> {
  try {
    // Open-Meteo doesn't have a direct reverse geocoding API
    // Use Nominatim (OpenStreetMap) for reverse geocoding - it's free and doesn't require API key
    const geoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const response = await fetch(geoUrl, {
      headers: {
        'User-Agent': 'StarspaceDashboard/1.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
        const state = addr.state || '';
        const country = addr.country_code?.toUpperCase() || '';

        // Convert full state name to abbreviation for US locations
        const stateAbbr = US_STATE_ABBREVIATIONS[state] || state;
        // Convert "US" to "USA"
        const countryDisplay = country === 'US' ? 'USA' : country;

        if (city && stateAbbr && countryDisplay) {
          return `${city}, ${stateAbbr} ${countryDisplay}`;
        } else if (city && stateAbbr) {
          return `${city}, ${stateAbbr}`;
        } else if (city && countryDisplay) {
          return `${city}, ${countryDisplay}`;
        } else if (city) {
          return city;
        }
      }
    }
  } catch (error) {
    console.error('Error getting location name:', error);
  }

  return 'Unknown Location';
}
