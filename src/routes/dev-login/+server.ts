/**
 * The dev preview's fake sign-in.
 *
 * Loopback gets the preview with no click, but a LAN address or the
 * `npm run dev:tunnel` hostname does not — that is what this is for. It sets
 * the cookie `isDevPreview()` reads, so you can open the dev server from a
 * phone without registering a GitHub OAuth callback for the tunnel.
 *
 * `DEV_PREVIEW_ENABLED` is statically false in any build, so a deployed copy of
 * this route answers 404 and nothing else.
 */

import { error, redirect } from '@sveltejs/kit';
import { DEV_PREVIEW_COOKIE, DEV_PREVIEW_ENABLED } from '$lib/server/devPreview';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	if (!DEV_PREVIEW_ENABLED) throw error(404, 'Not found');

	cookies.set(DEV_PREVIEW_COOKIE, 'on', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		// The tunnel is https, plain `vite dev` is not. `secure` on http is
		// dropped by the browser, which would make the button silently do
		// nothing on localhost.
		secure: false,
		maxAge: 60 * 60 * 24 * 30
	});

	throw redirect(303, '/');
};
