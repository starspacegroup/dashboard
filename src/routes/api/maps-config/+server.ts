import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  // Require authentication
  const session = await locals.auth();
  if (!session?.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  const apiKey = (env.GOOGLE_MAPS_API_KEY ?? '').trim();
  if (!apiKey) {
    return json({ error: 'Google Maps API key not configured' }, { status: 500 });
  }

  return json({ apiKey });
};
