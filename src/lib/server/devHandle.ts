/**
 * The dev-preview request handler: fakes the session and answers the
 * credential-gated APIs from fixtures. Only reached when `isDevPreview()` says
 * so — see `devPreview.ts` for the three gates that keep this off a deployed
 * build.
 *
 * Interception happens here, in one place, rather than as `if (dev)` branches
 * scattered through the API routes, so the real route code stays exactly as it
 * ships. A request carrying a real credential falls straight through to it.
 */

import { json, type Handle, type RequestEvent } from '@sveltejs/kit';
import { DEV_SESSION, DEV_CF_API_TOKEN, DEV_GA_REFRESH_TOKEN, isDevPreview } from './devPreview';
import {
	DEV_SEED_UPDATED_AT,
	devAnalyticsResponse,
	devCloudflareResponse,
	devDashboardSnapshot
} from './devFixtures';

interface StoredState {
	state: Record<string, string | null>;
	updatedAt: number;
}

/**
 * Dashboard state for the preview, held in the dev server's memory. `vite dev`
 * has no KV binding, so without this the sync engine gets a 501 and switches
 * itself off — which is fine, except the seed layout arrives the same way. A
 * restart drops it back to the seed; the browser's localStorage keeps your
 * edits either way.
 */
let devState: StoredState | null = null;

/** Read a JSON field from a request without consuming the body the route needs. */
async function peekBody(event: RequestEvent): Promise<Record<string, unknown>> {
	try {
		return (await event.request.clone().json()) as Record<string, unknown>;
	} catch {
		return {};
	}
}

/**
 * Answer this request from fixtures, or return null to let the real route run.
 */
async function fixtureResponse(event: RequestEvent): Promise<Response | null> {
	const path = event.url.pathname;
	const action = event.url.searchParams.get('action');

	if (path === '/api/dashboard-state') {
		if (event.request.method === 'GET') {
			return json(
				devState ?? {
					state: devDashboardSnapshot(DEV_GA_REFRESH_TOKEN, DEV_CF_API_TOKEN),
					updatedAt: DEV_SEED_UPDATED_AT
				}
			);
		}
		if (event.request.method === 'PUT') {
			const body = (await peekBody(event)) as unknown as StoredState;
			if (body && typeof body.state === 'object' && typeof body.updatedAt === 'number') {
				devState = { state: body.state, updatedAt: body.updatedAt };
				return json({ ok: true, updatedAt: body.updatedAt });
			}
			return json({ error: 'Body must be { state, updatedAt }' }, { status: 400 });
		}
	}

	// Below here: only answer for the preview's own placeholder credentials. A
	// real token you paste into a widget still reaches the real provider, so the
	// preview adds a sample dashboard without hiding your own data.
	if (path === '/api/analytics' && event.request.method === 'POST') {
		const body = await peekBody(event);
		if (body.refreshToken !== DEV_GA_REFRESH_TOKEN) return null;
		const data = devAnalyticsResponse(action, event.url);
		return data ? json(data) : json({ error: 'Invalid action.' }, { status: 400 });
	}

	if (path === '/api/cloudflare' && event.request.method === 'POST') {
		const body = await peekBody(event);
		if (String(body.apiToken ?? '').trim() !== DEV_CF_API_TOKEN) return null;
		const data = devCloudflareResponse(action, event.url);
		return data ? json(data) : json({ error: 'Invalid action.' }, { status: 400 });
	}

	return null;
}

/**
 * Wrap the real auth handle. Requests that don't qualify for the preview — a
 * LAN address, a tunnel hostname, a production build — go to `authHandle`
 * untouched, so sign-in still works exactly as before on those paths.
 *
 * `/auth/*` always goes to the real handle so Auth.js's own endpoints keep
 * responding rather than 404ing. Signing out there won't end the preview,
 * though: the preview isn't a cookie, it's a property of where you connected
 * from.
 */
export function withDevPreview(authHandle: Handle): Handle {
	return async (input) => {
		const { event, resolve } = input;
		if (!isDevPreview(event) || event.url.pathname.startsWith('/auth/')) {
			return authHandle(input);
		}

		event.locals.auth = async () => DEV_SESSION;

		const fixture = await fixtureResponse(event);
		if (fixture) return fixture;

		return resolve(event);
	};
}
