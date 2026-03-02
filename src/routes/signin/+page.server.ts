import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();

  // If already signed in, redirect to dashboard
  if (session?.user) {
    throw redirect(303, '/');
  }

  return {};
};
