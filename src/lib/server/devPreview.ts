/**
 * Local dev preview: sign-in bypass + sample data, on your machine only.
 *
 * `npm run dev` normally bounces straight to /signin, and even past that most
 * widgets sit on a "Connect" screen because they want a GitHub token, a Google
 * Analytics OAuth grant and a Cloudflare API key. That makes it impossible to
 * look at the dashboard — or to check a UI change — without doing a full OAuth
 * dance against real accounts. Dev preview fakes the session and answers the
 * credential-gated APIs with fixtures, so `npm run dev` opens on a populated
 * dashboard.
 *
 * ## What keeps this out of production
 *
 * Three independent gates, all of which must hold:
 *
 * 1. `dev` from `$app/environment` — true only under `vite dev`. Vite replaces
 *    it with the literal `false` in any build, so everything below is dead code
 *    that gets tree-shaken out of the deployed bundle. This is the load-bearing
 *    gate; the other two are belt and braces.
 * 2. The request must arrive on a loopback host. A `vite dev --host 0.0.0.0`
 *    server is reachable from the LAN, and `npm run dev:tunnel` publishes it on
 *    a real domain — neither may bypass sign-in. Only 127.0.0.1 / ::1 /
 *    localhost do, which also means the tunnel keeps exercising the real GitHub
 *    OAuth flow.
 * 3. `DEV_AUTH_BYPASS` must not be set to `false`, so you can turn the preview
 *    off and test real sign-in on localhost.
 *
 * There is deliberately no way to switch this on in a deployed build. It is not
 * a feature flag — it is a dev-server affordance.
 *
 * ## What is fake and what is real
 *
 * Only the things that need someone's credentials are faked: the session, the
 * GitHub payload behind the page load, Google Analytics, and Cloudflare. The
 * keyless APIs (weather, geocoding, crypto) run for real, so what you see there
 * is live data. The Traffic widget needs a Google Maps key and has no offline
 * mode; without `GOOGLE_MAPS_API_KEY` it shows its own not-configured state.
 *
 * The fixtures answer only for the placeholder credentials the preview seeds
 * (see `DEV_GA_REFRESH_TOKEN` / `DEV_CF_API_TOKEN`). Paste a real Cloudflare
 * token into the widget and the request goes to Cloudflare for real — the
 * preview adds a working sample, it doesn't hide your own data.
 */

import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Placeholder credentials the preview seeds into the dashboard. A request
 * carrying one of these is answered from fixtures; anything else is a real
 * credential and goes to the real provider.
 */
export const DEV_GA_REFRESH_TOKEN = 'dev-preview-ga-refresh-token';
export const DEV_CF_API_TOKEN = 'dev-preview-cloudflare-token';

/** Gates 1 and 3. Statically false in any build, so this whole module drops out. */
export const DEV_PREVIEW_ENABLED = dev && env.DEV_AUTH_BYPASS !== 'false';

/** Gate 2 — loopback only. A LAN address or a tunnel hostname is not local. */
function isLoopback(hostname: string): boolean {
	return (
		hostname === 'localhost' ||
		hostname === '127.0.0.1' ||
		hostname === '::1' ||
		hostname === '[::1]'
	);
}

/** True when this specific request may use the preview. */
export function isDevPreview(event: Pick<RequestEvent, 'url'>): boolean {
	return DEV_PREVIEW_ENABLED && isLoopback(event.url.hostname);
}

/**
 * The session the preview hands out. Shaped like a real GitHub session, with an
 * obviously-fake login so nothing in a screenshot or a log reads as a real
 * account. No `accessToken`: nothing should be calling GitHub with this.
 */
export const DEV_SESSION = {
	user: {
		name: 'Dev Preview',
		email: 'dev-preview@localhost',
		login: 'dev-preview',
		image: null
	}
} as const;
