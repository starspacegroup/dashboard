import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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

export const GET: RequestHandler = async ({ url, locals }) => {
  // Require authentication
  const session = await locals.getSession();
  if (!session?.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  const query = url.searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return json({ results: [] });
  }

  try {
    // Open-Meteo geocoding API - free, no API key required
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const response = await fetch(geoUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Geocoding API error:', errorText);
      return json(
        { error: 'Failed to geocode location' },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Transform the results to a cleaner format
    const results = (data.results || []).map((place: any) => {
      const state = place.admin1 || ''; // admin1 is usually the state/province
      const country = place.country_code?.toUpperCase() || place.country || '';

      // Convert full state name to abbreviation for US locations
      const stateAbbr = US_STATE_ABBREVIATIONS[state] || state;

      // Build display name
      let displayName = place.name;
      if (stateAbbr) {
        displayName += `, ${stateAbbr}`;
      }
      if (country) {
        displayName += `, ${country}`;
      }

      return {
        name: place.name,
        state: stateAbbr,
        country: country,
        lat: place.latitude,
        lon: place.longitude,
        timezone: place.timezone,
        displayName: displayName
      };
    });

    return json({ results });
  } catch (error) {
    console.error('Error geocoding:', error);
    return json(
      { error: 'Failed to geocode location' },
      { status: 500 }
    );
  }
};
