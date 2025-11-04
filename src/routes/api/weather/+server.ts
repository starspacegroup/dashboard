import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const { OPENWEATHER_API_KEY = '' } = env;

export const GET: RequestHandler = async ({ url }) => {
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  const zip = url.searchParams.get('zip');

  console.log('Weather API called with:', { lat, lon, zip });
  console.log('API Key configured:', !!OPENWEATHER_API_KEY.trim());

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
      console.log('Converting zip code to coordinates:', zip);
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

    console.log('Using coordinates:', { latitude, longitude });

    // Use One Call API 3.0
    // Note: This API requires a subscription (free tier available)
    // Include hourly data and daily data (for moon data) for the next 48 hours (we'll use 24)
    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&units=imperial&exclude=minutely,alerts&appid=${OPENWEATHER_API_KEY.trim()}`;

    console.log('Fetching from One Call API 3.0...');
    const response = await fetch(weatherUrl);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenWeather API error:', errorData);

      // If One Call 3.0 fails (e.g., subscription issue), fallback to geocoding + current weather
      console.log('Falling back to Current Weather API...');
      return await fallbackToCurrentWeather(latitude, longitude);
    }

    const data = await response.json();
    console.log('One Call API 3.0 response received successfully');

    // Get next 24 hours of hourly data
    const hourlyForecast = data.hourly.slice(0, 24).map((hour: any) => ({
      time: hour.dt,
      temperature: Math.round(hour.temp),
      feelsLike: Math.round(hour.feels_like),
      humidity: hour.humidity,
      dewPoint: Math.round(hour.dew_point),
      condition: hour.weather[0].main.toLowerCase(),
      icon: hour.weather[0].icon
    }));

    // Transform the One Call API 3.0 data to a simpler format
    const weatherData = {
      temperature: Math.round(data.current.temp),
      humidity: data.current.humidity,
      dewPoint: Math.round(data.current.dew_point),
      condition: data.current.weather[0].main.toLowerCase(),
      description: data.current.weather[0].description,
      location: await getLocationName(latitude, longitude),
      icon: data.current.weather[0].icon,
      hourly: hourlyForecast,
      sunrise: data.current.sunrise,
      sunset: data.current.sunset,
      moonrise: data.daily?.[0]?.moonrise || 0,
      moonset: data.daily?.[0]?.moonset || 0,
      timezone: data.timezone,
      timezoneOffset: data.timezone_offset,
      timestamp: Date.now()
    };

    console.log('Returning weather data:', weatherData);
    return json(weatherData);
  } catch (error) {
    console.error('Error fetching weather:', error);
    return json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
};

// Fallback to Current Weather API (2.5) if One Call 3.0 fails
async function fallbackToCurrentWeather(lat: string, lon: string) {
  try {
    console.log('Using Current Weather API 2.5 fallback...');
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${OPENWEATHER_API_KEY.trim()}`;
    const response = await fetch(weatherUrl);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Current Weather API error:', errorData);
      throw new Error('Current Weather API also failed');
    }

    const data = await response.json();
    console.log('Current Weather API 2.5 response received successfully');

    const weatherData = {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      dewPoint: 0, // Fallback API doesn't have dew point data
      condition: data.weather[0].main.toLowerCase(),
      description: data.weather[0].description,
      location: `${data.name}, ${data.sys.country}`,
      icon: data.weather[0].icon,
      hourly: [], // Fallback API doesn't have hourly data
      timestamp: Date.now()
    };

    console.log('Returning fallback weather data:', weatherData);
    return json(weatherData);
  } catch (error) {
    console.error('Fallback API error:', error);
    return json(
      { error: 'All weather APIs failed' },
      { status: 500 }
    );
  }
}

// Convert zip code to coordinates using geocoding API
async function getCoordinatesFromZip(zip: string): Promise<{ lat: string; lon: string; } | null> {
  try {
    // OpenWeather geocoding API for zip codes (US only by default)
    const geoUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${zip},US&appid=${OPENWEATHER_API_KEY.trim()}`;
    console.log('Geocoding zip code...');
    const response = await fetch(geoUrl);

    if (response.ok) {
      const data = await response.json();
      console.log('Geocoding successful:', data);
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

// Get location name from coordinates using reverse geocoding
async function getLocationName(lat: string, lon: string): Promise<string> {
  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY.trim()}`;
    const response = await fetch(geoUrl);

    if (response.ok) {
      const data = await response.json();
      if (data.length > 0) {
        const place = data[0];
        return `${place.name}, ${place.state || place.country}`;
      }
    }
  } catch (error) {
    console.error('Error getting location name:', error);
  }

  return 'Unknown Location';
}
