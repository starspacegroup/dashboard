import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const { GOOGLE_MAPS_API_KEY = '' } = env;

export const GET: RequestHandler = async () => {
  if (!GOOGLE_MAPS_API_KEY.trim()) {
    return json({ error: 'Google Maps API key not configured' }, { status: 500 });
  }

  return json({ apiKey: GOOGLE_MAPS_API_KEY.trim() });
};
