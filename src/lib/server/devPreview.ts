/**
 * Local dev preview: a fake sign-in + sample data, on any host `vite dev` serves.
 *
 * `npm run dev` normally bounces straight to /signin, and even past that most
 * widgets sit on a "Connect" screen because they want a GitHub token, a Google
 * Analytics OAuth grant and a Cloudflare API key. That makes it impossible to
 * look at the dashboard — or to check a UI change — without doing a full OAuth
 * dance against real accounts. Dev preview fakes the session and answers the
 * credential-gated APIs with fixtures, so `npm run dev` opens on a populated
 * dashboard.
 *
 * ## How you get into it
 *
 * On a loopback host the preview is simply on — `npm run dev` opens straight
 * onto a populated dashboard, no click.
 *
 * Anywhere else the dev server is reachable (a LAN address, or the public
 * hostname `npm run dev:tunnel` publishes) the sign-in page offers a
 * **Continue as Dev Preview** button beside the GitHub one. It posts to
 * `/dev-login`, which sets the `dev-preview` cookie below; that cookie is what
 * carries the fake session from then on. Signing out clears it, so the real
 * GitHub flow is always one sign-out away, on any host.
 *
 * ## What keeps this out of production
 *
 * Two gates, both of which must hold:
 *
 * 1. `dev` from `$app/environment` — true only under `vite dev`. Vite replaces
 *    it with the literal `false` in any build, so everything below is dead code
 *    that gets tree-shaken out of the deployed bundle. This is the load-bearing
 *    gate; the other is belt and braces.
 * 2. `DEV_AUTH_BYPASS` must not be set to `false`, so you can turn the preview
 *    off entirely and test real sign-in.
 *
 * There is deliberately no way to switch this on in a deployed build. It is not
 * a feature flag — it is a dev-server affordance.
 *
 * ⚠️ The host is no longer a gate. It used to be: only loopback could bypass
 * sign-in, so the tunnel kept exercising real GitHub OAuth. That was traded
 * away deliberately (David, 2026-09-04) for being able to look at the dashboard
 * from a phone without registering an OAuth callback. The consequence is that
 * **while `npm run dev:tunnel` is up, anyone who has the URL can click into the
 * sample dashboard.** It is sample data, and the fake session carries no
 * `accessToken` — but a real Cloudflare or GA token you paste into a widget is
 * synced state, and a visitor would see what it renders. Take the tunnel down
 * when you are done with it.
 *
 * ## What is fake and what is real
 *
 * Only the things that need someone's credentials are faked: the session, the
 * GitHub payload behind the page load, Google Analytics, Cloudflare, and the
 * Traffic widget's map (a drawn stand-in, since a real map needs a billable
 * Google key). The keyless APIs — weather, geocoding, crypto — run for real, so
 * what you see there is live data.
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

/** Both gates. Statically false in any build, so this whole module drops out. */
export const DEV_PREVIEW_ENABLED = dev && env.DEV_AUTH_BYPASS !== 'false';

/**
 * Carries the fake session off loopback. `on` is set by `/dev-login`, `off` by
 * signing out — and `off` beats the loopback default, which is what makes the
 * real GitHub flow reachable on localhost too.
 */
export const DEV_PREVIEW_COOKIE = 'dev-preview';

/** Where the preview is on by default, with no click and no cookie. */
function isLoopback(hostname: string): boolean {
	return (
		hostname === 'localhost' ||
		hostname === '127.0.0.1' ||
		hostname === '::1' ||
		hostname === '[::1]'
	);
}

type PreviewEvent = Pick<RequestEvent, 'url'> & {
	cookies?: Pick<RequestEvent['cookies'], 'get'>;
};

/** True when this specific request may use the preview. */
export function isDevPreview(event: PreviewEvent): boolean {
	if (!DEV_PREVIEW_ENABLED) return false;
	const choice = event.cookies?.get(DEV_PREVIEW_COOKIE);
	if (choice === 'on') return true;
	if (choice === 'off') return false;
	return isLoopback(event.url.hostname);
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
