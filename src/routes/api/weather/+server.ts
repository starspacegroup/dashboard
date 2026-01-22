import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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

export const GET: RequestHandler = async ({ url }) => {
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

    // Fetch current weather and forecast from Open-Meteo
    // Using Fahrenheit (temperature_unit=fahrenheit) for consistency with existing code
    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
    forecastUrl.searchParams.set('latitude', latitude);
    forecastUrl.searchParams.set('longitude', longitude);
    forecastUrl.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day,surface_pressure');
    forecastUrl.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,weather_code,is_day,surface_pressure');
    forecastUrl.searchParams.set('daily', 'sunrise,sunset');
    forecastUrl.searchParams.set('temperature_unit', 'fahrenheit');
    forecastUrl.searchParams.set('timezone', 'auto');
    forecastUrl.searchParams.set('past_days', '1');
    forecastUrl.searchParams.set('forecast_days', '2');

    const response = await fetch(forecastUrl.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Open-Meteo API error:', errorText);
      return json(
        { error: 'Failed to fetch weather data from Open-Meteo' },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Get current time index in the hourly arrays
    const now = new Date();
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

    // Parse sunrise/sunset for today
    const todayIndex = data.daily.time.findIndex((d: string) => {
      const date = new Date(d);
      return date.toDateString() === now.toDateString();
    });

    const sunriseTime = todayIndex >= 0 ? new Date(data.daily.sunrise[todayIndex]).getTime() / 1000 : 0;
    const sunsetTime = todayIndex >= 0 ? new Date(data.daily.sunset[todayIndex]).getTime() / 1000 : 0;

    // Calculate moon phase and moonrise/moonset
    const moonData = calculateMoonData(parseFloat(latitude), parseFloat(longitude), now);

    // Get location name via reverse geocoding
    const locationName = await getLocationName(latitude, longitude);

    // Get timezone offset in seconds
    const timezoneOffset = getTimezoneOffset(data.timezone);

    const weatherData = {
      temperature: Math.round(currentTemp),
      humidity: currentHumidity,
      dewPoint: Math.round(dewPointEstimate),
      pressure: Math.round(currentPressure * 10) / 10,
      pressureTrend: pressureTrend,
      condition: weatherInfo.condition,
      description: weatherInfo.description,
      location: locationName,
      icon: weatherInfo.icon,
      hourly: interpolatedHourly,
      sunrise: sunriseTime,
      sunset: sunsetTime,
      moonrise: moonData.moonrise,
      moonset: moonData.moonset,
      moonPhase: moonData.phase,
      timezone: data.timezone,
      timezoneOffset: timezoneOffset,
      timestamp: Date.now()
    };

    return json(weatherData);
  } catch (error) {
    console.error('Error fetching weather:', error);
    return json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
};

// Calculate pressure trend from hourly data
// Returns: 'rising', 'falling', 'steady', or 'rapidly-rising', 'rapidly-falling'
function calculatePressureTrend(times: string[], pressures: number[]): { direction: string; change: number; } {
  const now = Date.now();
  const threeHoursAgo = now - 3 * 60 * 60 * 1000;

  // Find pressure readings from approximately 3 hours ago and now
  let oldestPressure: number | null = null;
  let newestPressure: number | null = null;
  let oldestTime = 0;
  let newestTime = 0;

  for (let i = 0; i < times.length; i++) {
    const time = new Date(times[i]).getTime();
    const pressure = pressures[i];

    // Find the reading closest to 3 hours ago
    if (time >= threeHoursAgo - 30 * 60 * 1000 && time <= threeHoursAgo + 30 * 60 * 1000) {
      if (oldestPressure === null || Math.abs(time - threeHoursAgo) < Math.abs(oldestTime - threeHoursAgo)) {
        oldestPressure = pressure;
        oldestTime = time;
      }
    }

    // Find the most recent reading (closest to now)
    if (time <= now && time > now - 60 * 60 * 1000) {
      if (newestPressure === null || time > newestTime) {
        newestPressure = pressure;
        newestTime = time;
      }
    }
  }

  if (oldestPressure === null || newestPressure === null) {
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

// Calculate moon phase and approximate rise/set times
// Moon phase: 0 = new moon, 0.5 = full moon, 1 = new moon
function calculateMoonData(lat: number, lon: number, date: Date): { phase: number; moonrise: number; moonset: number; } {
  // Calculate moon phase using a simplified algorithm
  // Based on the synodic month (29.53059 days)
  const synodicMonth = 29.53059;

  // Known new moon: January 6, 2000, 18:14 UTC
  const knownNewMoon = new Date('2000-01-06T18:14:00Z').getTime();
  const now = date.getTime();

  const daysSinceNewMoon = (now - knownNewMoon) / (1000 * 60 * 60 * 24);
  const moonAge = daysSinceNewMoon % synodicMonth;
  const phase = moonAge / synodicMonth;

  // Approximate moonrise/moonset calculation
  // This is a simplified calculation - for accurate times, a proper astronomical library would be needed
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  const midnightTimestamp = midnight.getTime() / 1000;

  // Moon rises about 50 minutes later each day
  // At new moon, moon rises/sets with the sun
  // At full moon, moon rises at sunset and sets at sunrise
  const phaseOffset = phase * 24 * 3600; // Phase affects rise time throughout the day

  // Rough approximation: moonrise varies through the day based on phase
  const moonrise = midnightTimestamp + phaseOffset;
  const moonset = moonrise + 12 * 3600; // Moon is up for roughly 12 hours

  return {
    phase,
    moonrise: Math.round(moonrise),
    moonset: Math.round(moonset)
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
