import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals, cookies }) => {
  const session = await locals.auth();
  if (!session?.user) {
    return popupError('Authentication required');
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  if (errorParam) {
    return popupError(`Google denied access: ${sanitizeProviderError(errorParam)}`);
  }

  if (!code || !state) {
    return popupError('Missing code or state parameter');
  }

  // Validate CSRF state
  const savedState = cookies.get('ga_oauth_state');
  cookies.delete('ga_oauth_state', { path: '/' });

  if (!savedState || savedState !== state) {
    return popupError('Invalid state parameter (CSRF check failed)');
  }

  const clientId = env.GA_OAUTH_CLIENT_ID ?? '';
  const clientSecret = env.GA_OAUTH_CLIENT_SECRET ?? '';

  if (!clientId || !clientSecret) {
    return popupError('GA OAuth not configured on server');
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
    return popupError('Failed to exchange authorization code for tokens');
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  if (!tokenData.refresh_token) {
    return popupError('No refresh token received. Try disconnecting and reconnecting.');
  }

  // Hand the refresh token back to the opener via postMessage
  return popupResponse({ refreshToken: tokenData.refresh_token });
};

/**
 * Google's `error` param is attacker-controllable (anyone can craft a link to
 * this callback). `safeJson` already stops it breaking out of the script, but
 * there is no reason to echo arbitrary text back at the user — OAuth error
 * codes are short slugs, so keep it to that shape.
 */
function sanitizeProviderError(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_ -]/g, '').trim();
  return cleaned.slice(0, 64) || 'unknown error';
}

/**
 * JSON safe to embed inside an inline <script>. Plain JSON.stringify is not:
 * it leaves `</script>` intact, so an attacker-controlled substring could close
 * the script block and run its own code on this origin — where the GA refresh
 * token and the Cloudflare API tokens live in localStorage. Escaping `<`, `>`
 * and `&` closes that; U+2028/U+2029 are escaped because they are legal in JSON
 * but are literal line terminators in JavaScript.
 */
function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function popupError(message: string): Response {
  return popupResponse({ error: message });
}

/** The popup's only job: hand `payload` to the opener, then close. */
function popupResponse(payload: { error: string } | { refreshToken: string }): Response {
  const isError = 'error' in payload;
  const html = `<!DOCTYPE html>
<html>
<head><title>Google Analytics</title></head>
<body>
<script>
(function() {
	var payload = ${safeJson(payload)};
	if (window.opener) {
		window.opener.postMessage({ type: 'ga-oauth-callback', ...payload }, window.location.origin);
		window.close();
	} else {
		document.body.textContent = ${isError ? "'Error: ' + payload.error" : "'Connected! You can close this window.'"};
	}
})();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // This body carries a Google refresh token — never let it be stored.
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer'
    }
  });
}
