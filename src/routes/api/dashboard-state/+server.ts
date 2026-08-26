import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import {
	decryptState,
	encryptState,
	parseStateEncryptionConfig,
	type StateEncryptionConfig
} from '$lib/server/stateEncryption';

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

// Sanity bound on a dashboard snapshot (KV's own value limit is 25 MB). Real
// snapshots are a few KB; anything near this is a bug or an abusive client.
const MAX_STATE_BYTES = 512 * 1024;

function encryptionConfig(): StateEncryptionConfig | null {
	try {
		return parseStateEncryptionConfig(env);
	} catch {
		return null;
	}
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

function parseStoredState(value: string): StoredState {
	const stored = JSON.parse(value) as StoredState;
	if (!stored || typeof stored.state !== 'object' || stored.state === null || typeof stored.updatedAt !== 'number') {
		throw new Error('Invalid stored dashboard state');
	}
	return stored;
}

async function migrateStoredState(
	kv: NonNullable<ReturnType<typeof getKV>>,
	key: string,
	original: string,
	stored: StoredState,
	config: StateEncryptionConfig
): Promise<void> {
	try {
		// KV has no compare-and-set operation. Re-read immediately before the
		// migration write so a snapshot changed by another request is not replaced
		// by the older value this GET observed.
		if (await kv.get(key) !== original) return;
		await kv.put(key, await encryptState(JSON.stringify(stored), config, key));
	} catch {
		// A migration write must not make an otherwise valid snapshot unreadable.
		// The next GET will retry while the legacy record remains in place.
	}
}

export const GET: RequestHandler = async ({ locals, platform }) => {
	const key = await getUserKey(locals);
	if (!key) return json({ error: 'Authentication required' }, { status: 401 });

	const kv = getKV(platform);
	if (!kv) return json({ error: 'Sync not configured' }, { status: 501 });
	const config = encryptionConfig();
	if (!config) return json({ error: 'Sync encryption not configured' }, { status: 503 });

	const raw = await kv.get(key);
	if (!raw) return json({ state: null, updatedAt: 0 });

	try {
		const decrypted = await decryptState(raw, config, key);
		const stored = parseStoredState(decrypted.plaintext);
		if (decrypted.needsMigration) await migrateStoredState(kv, key, raw, stored, config);
		return json(stored);
	} catch {
		return json({ error: 'Synced state could not be decrypted' }, { status: 503 });
	}
};

export const PUT: RequestHandler = async ({ locals, platform, request }) => {
	const key = await getUserKey(locals);
	if (!key) return json({ error: 'Authentication required' }, { status: 401 });

	const kv = getKV(platform);
	if (!kv) return json({ error: 'Sync not configured' }, { status: 501 });
	const config = encryptionConfig();
	if (!config) return json({ error: 'Sync encryption not configured' }, { status: 503 });

	let body: StoredState;
	try {
		body = (await request.json()) as StoredState;
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	if (!body || typeof body.state !== 'object' || body.state === null || typeof body.updatedAt !== 'number') {
		return json({ error: 'Body must be { state, updatedAt }' }, { status: 400 });
	}

	const serializedState = JSON.stringify(body.state);
	if (serializedState.length > MAX_STATE_BYTES) {
		return json({ error: 'State too large' }, { status: 413 });
	}

	// Don't clobber a newer remote state with an older local one
	const existingRaw = await kv.get(key);
	if (existingRaw) {
		try {
			const decrypted = await decryptState(existingRaw, config, key);
			const existing = parseStoredState(decrypted.plaintext);
			if (existing.updatedAt > body.updatedAt) {
				return json({ ok: false, conflict: true, updatedAt: existing.updatedAt });
			}
			// Byte-identical to what's already stored? Writing it again buys
			// nothing and KV writes are the scarce free-tier resource (1,000/day
			// account-wide). The client guards this too, but each tab tracks its
			// own last-pushed snapshot, so two open tabs still push the same
			// bytes twice. See planning/kv-write-amplification.md.
			if (!decrypted.needsMigration && JSON.stringify(existing.state) === serializedState) {
				return json({ ok: true, unchanged: true, updatedAt: existing.updatedAt });
			}
		} catch {
			return json(
				{ error: 'Existing synced state could not be decrypted; refusing to overwrite it' },
				{ status: 409 }
			);
		}
	}

	const stored = JSON.stringify({ state: body.state, updatedAt: body.updatedAt });
	await kv.put(key, await encryptState(stored, config, key));
	return json({ ok: true, updatedAt: body.updatedAt });
};
