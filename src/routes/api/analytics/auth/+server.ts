import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals, cookies }) => {
  const session = await locals.auth();
  if (!session?.user) {
    return new Response('Authentication required', { status: 401 });
  }

  const clientId = env.GA_OAUTH_CLIENT_ID ?? '';
  if (!clientId) {
    return new Response('GA_OAUTH_CLIENT_ID not configured', { status: 500 });
  }

  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();
  cookies.set('ga_oauth_state', state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    maxAge: 600 // 10 minutes
  });

  const redirectUri = `${url.origin}/api/analytics/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state
  });

  redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};
