import { redirect } from '@sveltejs/kit';
import { DEV_PREVIEW_ENABLED } from '$lib/server/devPreview';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();

  // If already signed in, redirect to dashboard
  if (session?.user) {
    throw redirect(303, '/');
  }

  // Offers the fake sign-in button. Statically false in any build, so the
  // button cannot appear on the deployed site — see $lib/server/devPreview.
  return { devLogin: DEV_PREVIEW_ENABLED };
};
