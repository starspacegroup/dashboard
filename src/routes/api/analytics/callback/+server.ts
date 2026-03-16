import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals, cookies }) => {
  const session = await locals.auth();
  if (!session?.user) {
    return htmlResponse('Authentication required', true);
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  if (errorParam) {
    return htmlResponse(`Google denied access: ${errorParam}`, true);
  }

  if (!code || !state) {
    return htmlResponse('Missing code or state parameter', true);
  }

  // Validate CSRF state
  const savedState = cookies.get('ga_oauth_state');
  cookies.delete('ga_oauth_state', { path: '/' });

  if (!savedState || savedState !== state) {
    return htmlResponse('Invalid state parameter (CSRF check failed)', true);
  }

  const clientId = env.GA_OAUTH_CLIENT_ID ?? '';
  const clientSecret = env.GA_OAUTH_CLIENT_SECRET ?? '';

  if (!clientId || !clientSecret) {
    return htmlResponse('GA OAuth not configured on server', true);
  }

  const redirectUri = `${url.origin}/api/analytics/callback`;

  // Exchange auth code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    console.error('GA OAuth token exchange failed:', tokenRes.status, errBody);
    return htmlResponse('Failed to exchange authorization code for tokens', true);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  if (!tokenData.refresh_token) {
    return htmlResponse('No refresh token received. Try disconnecting and reconnecting.', true);
  }

  // Return HTML page that sends tokens back to the opener via postMessage
  return htmlResponse(
    JSON.stringify({
      refreshToken: tokenData.refresh_token
    }),
    false
  );
};

function htmlResponse(payload: string, isError: boolean): Response {
  const html = `<!DOCTYPE html>
<html>
<head><title>Google Analytics</title></head>
<body>
<script>
(function() {
	var isError = ${isError ? 'true' : 'false'};
	var payload = isError ? { error: ${JSON.stringify(payload)} } : ${isError ? '{}' : payload};
	if (window.opener) {
		window.opener.postMessage({ type: 'ga-oauth-callback', ...payload }, window.location.origin);
		window.close();
	} else {
		document.body.textContent = isError ? 'Error: ' + ${JSON.stringify(payload)} : 'Connected! You can close this window.';
	}
})();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
