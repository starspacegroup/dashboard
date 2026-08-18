import type { LayoutServerLoad } from './$types';
import { isDevPreview, DEV_SESSION } from '$lib/server/devPreview';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Local dev only: a fake session so the dashboard renders without signing in.
	// Statically dropped from any build — see $lib/server/devPreview.
	if (isDevPreview({ url })) {
		return { user: DEV_SESSION.user, devPreview: true };
	}

	const session = await locals.auth();
	return {
		user: session?.user,
		devPreview: false
	};
};
