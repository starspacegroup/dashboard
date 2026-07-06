import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Server-side persistence for dashboard state (widgets, sections, layouts,
 * location, analytics connection). Backed by Cloudflare KV so the same
 * logged-in user gets the same dashboard on every device/browser.
 *
 * Conflict resolution is last-write-wins via the client-supplied updatedAt.
 */

interface StoredState {
	state: Record<string, string | null>;
	updatedAt: number;
}

function getKV(platform: Readonly<App.Platform> | undefined) {
	return platform?.env?.DASHBOARD_KV ?? null;
}

async function getUserKey(locals: App.Locals): Promise<string | null> {
	const session = await locals.auth();
	if (!session?.user) return null;
	const id = session.user.login || session.user.email;
	return id ? `dashboard-state:${id}` : null;
}

export const GET: RequestHandler = async ({ locals, platform }) => {
	const key = await getUserKey(locals);
	if (!key) return json({ error: 'Authentication required' }, { status: 401 });

	const kv = getKV(platform);
	if (!kv) return json({ error: 'Sync not configured' }, { status: 501 });

	const raw = await kv.get(key);
	if (!raw) return json({ state: null, updatedAt: 0 });

	try {
		const stored = JSON.parse(raw) as StoredState;
		return json(stored);
	} catch {
		return json({ state: null, updatedAt: 0 });
	}
};

export const PUT: RequestHandler = async ({ locals, platform, request }) => {
	const key = await getUserKey(locals);
	if (!key) return json({ error: 'Authentication required' }, { status: 401 });

	const kv = getKV(platform);
	if (!kv) return json({ error: 'Sync not configured' }, { status: 501 });

	let body: StoredState;
	try {
		body = (await request.json()) as StoredState;
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	if (!body || typeof body.state !== 'object' || typeof body.updatedAt !== 'number') {
		return json({ error: 'Body must be { state, updatedAt }' }, { status: 400 });
	}

	// Don't clobber a newer remote state with an older local one
	const existingRaw = await kv.get(key);
	if (existingRaw) {
		try {
			const existing = JSON.parse(existingRaw) as StoredState;
			if (existing.updatedAt > body.updatedAt) {
				return json({ ok: false, conflict: true, updatedAt: existing.updatedAt });
			}
		} catch {
			// corrupt existing state — overwrite it
		}
	}

	await kv.put(key, JSON.stringify({ state: body.state, updatedAt: body.updatedAt }));
	return json({ ok: true, updatedAt: body.updatedAt });
};
