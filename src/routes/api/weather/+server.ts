import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const { OPENWEATHER_API_KEY = '' } = env;

export const GET: RequestHandler = async ({ url }) => {
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  const zip = url.searchParams.get('zip');

  if (!OPENWEATHER_API_KEY.trim()) {
    console.error('OPENWEATHER_API_KEY is not set!');
    return json(
      { error: 'OpenWeather API key not configured' },
      { status: 500 }
    );
  }

  try {
    // One Call API 3.0 requires coordinates
    let latitude: string;
    let longitude: string;

    if (zip) {
      // Convert zip code to coordinates using geocoding API
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

    // Use One Call API 3.0
    // Note: This API requires a subscription (free tier available)
    // Include hourly data and daily data (for moon data) for the next 48 hours (we'll use 24)
    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&units=imperial&exclude=minutely,alerts&appid=${OPENWEATHER_API_KEY.trim()}`;

    const response = await fetch(weatherUrl);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenWeather API error:', errorData);

      // If One Call 3.0 fails (e.g., subscription issue), fallback to geocoding + current weather
      return await fallbackToCurrentWeather(latitude, longitude);
    }

    const data = await response.json();

    // Get next 24 hours of hourly data (future forecast)
    const futureHourly = data.hourly.slice(0, 24).map((hour: any) => ({
      time: hour.dt,
      temperature: Math.round(hour.temp),
      feelsLike: Math.round(hour.feels_like),
      humidity: hour.humidity,
      dewPoint: Math.round(hour.dew_point),
      condition: hour.weather[0].main.toLowerCase(),
      icon: hour.weather[0].icon
    }));

    // Fetch historical data for the past 24 hours using Time Machine API
    const historicalHourly = await fetchHistoricalData(latitude, longitude);

    // Combine historical + current + future data, then interpolate to 30-min resolution
    const allHourlyData = [...historicalHourly, ...futureHourly];

    // Remove duplicates (based on timestamp) and sort by time
    const uniqueHourly = allHourlyData.reduce((acc: any[], curr) => {
      if (!acc.find(h => h.time === curr.time)) {
        acc.push(curr);
      }
      return acc;
    }, []).sort((a, b) => a.time - b.time);

    // Interpolate to 30-minute resolution
    const interpolatedHourly = interpolateToHalfHour(uniqueHourly);

    // Transform the One Call API 3.0 data to a simpler format
    const weatherData = {
      temperature: Math.round(data.current.temp),
      humidity: data.current.humidity,
      dewPoint: Math.round(data.current.dew_point),
      condition: data.current.weather[0].main.toLowerCase(),
      description: data.current.weather[0].description,
      location: await getLocationName(latitude, longitude),
      icon: data.current.weather[0].icon,
      hourly: interpolatedHourly,
      sunrise: data.current.sunrise,
      sunset: data.current.sunset,
      moonrise: data.daily?.[0]?.moonrise || 0,
      moonset: data.daily?.[0]?.moonset || 0,
      moonPhase: data.daily?.[0]?.moon_phase,
      timezone: data.timezone,
      timezoneOffset: data.timezone_offset,
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

// Fetch historical weather data for the past 24 hours
async function fetchHistoricalData(lat: string, lon: string): Promise<any[]> {
  const historicalData: any[] = [];
  const now = Math.floor(Date.now() / 1000);

  // We need to fetch data for distinct days that cover the past 24 hours
  // The timemachine endpoint returns hourly data for a specific day
  // We'll fetch yesterday's data and today's past hours

  try {
    // Fetch data for 24 hours ago (to get yesterday's hourly data)
    const yesterday = now - 24 * 60 * 60;
    const timeMachineUrl = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${yesterday}&units=imperial&appid=${OPENWEATHER_API_KEY.trim()}`;

    const response = await fetch(timeMachineUrl);

    if (response.ok) {
      const data = await response.json();

      // The timemachine API returns data for the requested timestamp
      // It includes hourly data for that day
      if (data.data && Array.isArray(data.data)) {
        for (const hour of data.data) {
          // Only include data points from the past 24 hours
          if (hour.dt >= now - 24 * 60 * 60 && hour.dt <= now) {
            historicalData.push({
              time: hour.dt,
              temperature: Math.round(hour.temp),
              feelsLike: Math.round(hour.feels_like),
              humidity: hour.humidity,
              dewPoint: Math.round(hour.dew_point || 0),
              condition: hour.weather?.[0]?.main?.toLowerCase() || 'clear',
              icon: hour.weather?.[0]?.icon || '01d'
            });
          }
        }
      }
    } else {
      console.error('Time Machine API error:', await response.text());
    }

    // Also fetch today's historical data (for hours between midnight and now)
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const todayTimestamp = Math.floor(todayMidnight.getTime() / 1000);

    // Only fetch if today is different from yesterday's request
    if (todayTimestamp > yesterday) {
      const todayUrl = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${todayTimestamp}&units=imperial&appid=${OPENWEATHER_API_KEY.trim()}`;

      const todayResponse = await fetch(todayUrl);

      if (todayResponse.ok) {
        const todayData = await todayResponse.json();

        if (todayData.data && Array.isArray(todayData.data)) {
          for (const hour of todayData.data) {
            // Only include past data points (before now)
            if (hour.dt >= now - 24 * 60 * 60 && hour.dt <= now) {
              // Check if we already have this timestamp
              if (!historicalData.find(h => h.time === hour.dt)) {
                historicalData.push({
                  time: hour.dt,
                  temperature: Math.round(hour.temp),
                  feelsLike: Math.round(hour.feels_like),
                  humidity: hour.humidity,
                  dewPoint: Math.round(hour.dew_point || 0),
                  condition: hour.weather?.[0]?.main?.toLowerCase() || 'clear',
                  icon: hour.weather?.[0]?.icon || '01d'
                });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching historical data:', error);
  }

  return historicalData.sort((a, b) => a.time - b.time);
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
          condition: current.condition, // Keep the earlier condition
          icon: current.icon,
          interpolated: true // Mark as interpolated
        });
      }
    }
  }

  return interpolated;
}

// Fallback to Current Weather API (2.5) if One Call 3.0 fails
async function fallbackToCurrentWeather(lat: string, lon: string) {
  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${OPENWEATHER_API_KEY.trim()}`;
    const response = await fetch(weatherUrl);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Current Weather API error:', errorData);
      throw new Error('Current Weather API also failed');
    }

    const data = await response.json();

    // Get IANA timezone from coordinates using a timezone lookup
    const timezoneString = await getTimezoneFromCoords(lat, lon);

    const weatherData = {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      dewPoint: 0, // Fallback API doesn't have dew point data
      condition: data.weather[0].main.toLowerCase(),
      description: data.weather[0].description,
      location: `${data.name}, ${data.sys.country}`,
      icon: data.weather[0].icon,
      hourly: [], // Fallback API doesn't have hourly data
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      timezone: timezoneString,
      timezoneOffset: data.timezone, // OpenWeather 2.5 API returns timezone offset in seconds
      timestamp: Date.now()
    };

    return json(weatherData);
  } catch (error) {
    console.error('Fallback API error:', error);
    return json(
      { error: 'All weather APIs failed' },
      { status: 500 }
    );
  }
}

// Get IANA timezone string from coordinates
async function getTimezoneFromCoords(lat: string, lon: string): Promise<string> {
  try {
    // Use timeapi.io for IANA timezone lookup (free, no API key needed)
    const response = await fetch(`https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lon}`);
    if (response.ok) {
      const data = await response.json();
      return data.timeZone || '';
    }
  } catch (error) {
    console.error('Error getting timezone:', error);
  }
  return '';
}

// Convert zip code to coordinates using geocoding API
async function getCoordinatesFromZip(zip: string): Promise<{ lat: string; lon: string; } | null> {
  try {
    // OpenWeather geocoding API for zip codes (US only by default)
    const geoUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${zip},US&appid=${OPENWEATHER_API_KEY.trim()}`;
    const response = await fetch(geoUrl);

    if (response.ok) {
      const data = await response.json();
      return {
        lat: data.lat.toString(),
        lon: data.lon.toString()
      };
    } else {
      console.error('Geocoding failed:', await response.text());
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

// Get location name from coordinates using reverse geocoding
async function getLocationName(lat: string, lon: string): Promise<string> {
  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY.trim()}`;
    const response = await fetch(geoUrl);

    if (response.ok) {
      const data = await response.json();
      if (data.length > 0) {
        const place = data[0];
        // Format: "City, ST USA" (e.g., "Chandler, AZ USA")
        const city = place.name;
        const stateFull = place.state || '';
        const country = place.country || '';

        // Convert full state name to abbreviation for US locations
        const stateAbbr = US_STATE_ABBREVIATIONS[stateFull] || stateFull;
        // Convert "US" to "USA"
        const countryDisplay = country === 'US' ? 'USA' : country;

        if (stateAbbr && countryDisplay) {
          return `${city}, ${stateAbbr} ${countryDisplay}`;
        } else if (stateAbbr) {
          return `${city}, ${stateAbbr}`;
        } else if (countryDisplay) {
          return `${city}, ${countryDisplay}`;
        }
        return city;
      }
    }
  } catch (error) {
    console.error('Error getting location name:', error);
  }

  return 'Unknown Location';
}
