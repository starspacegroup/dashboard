import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const { OPENWEATHER_API_KEY = '' } = env;

export const GET: RequestHandler = async ({ url }) => {
  const query = url.searchParams.get('q');

  if (!OPENWEATHER_API_KEY.trim()) {
    console.error('OPENWEATHER_API_KEY is not set!');
    return json(
      { error: 'OpenWeather API key not configured' },
      { status: 500 }
    );
  }

  if (!query || query.trim().length < 2) {
    return json({ results: [] });
  }

  try {
    // OpenWeather geocoding API - supports city names, zip codes, etc.
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${OPENWEATHER_API_KEY.trim()}`;
    const response = await fetch(geoUrl);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Geocoding API error:', errorData);
      return json(
        { error: 'Failed to geocode location' },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Transform the results to a cleaner format
    const results = data.map((place: any) => ({
      name: place.name,
      state: place.state || '',
      country: place.country,
      lat: place.lat,
      lon: place.lon,
      displayName: place.state
        ? `${place.name}, ${place.state}, ${place.country}`
        : `${place.name}, ${place.country}`
    }));

    return json({ results });
  } catch (error) {
    console.error('Error geocoding:', error);
    return json(
      { error: 'Failed to geocode location' },
      { status: 500 }
    );
  }
};
