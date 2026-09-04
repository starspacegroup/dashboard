import { redirect } from '@sveltejs/kit';
import { DEV_PREVIEW_ENABLED } from '$lib/server/devPreview';
import type { PageServerLoad } from './$types';

/**
 * Auth.js collapses every error it doesn't consider client-safe into
 * `Configuration`, so that value carries almost no information — in practice it
 * is nearly always a replayed authorization code (a refresh on the callback
 * URL) or a PKCE cookie past its 15-minute life, not a broken deployment. Say
 * the thing the user can act on, and leave the diagnosis to the server logs,
 * where Auth.js prints the provider's verbatim response.
 */
function describeAuthError(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case 'AccessDenied':
      return 'GitHub declined that sign-in. If you cancelled by accident, try again.';
    case 'Verification':
      return 'That sign-in link has already been used or has expired. Try again.';
    default:
      return 'That sign-in did not go through — the link was probably already used or had expired. Try again.';
  }
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = await locals.auth();

  // If already signed in, redirect to dashboard
  if (session?.user) {
    throw redirect(303, '/');
  }

  return {
    // Offers the fake sign-in button. Statically false in any build, so the
    // button cannot appear on the deployed site — see $lib/server/devPreview.
    devLogin: DEV_PREVIEW_ENABLED,
    authError: describeAuthError(url.searchParams.get('error'))
  };
};
