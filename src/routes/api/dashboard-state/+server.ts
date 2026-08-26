import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import {
	decryptState,
	encryptState,
	parseStateEncryptionConfig,
	type DecryptedState,
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

interface UserKeys {
	current: string;
	migration: string;
	legacy: string;
}

interface StoredSource {
	key: string;
	stored: StoredState;
	decrypted: DecryptedState;
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

async function getUserKeys(locals: App.Locals): Promise<UserKeys | null> {
	const session = await locals.auth();
	if (!session?.user) return null;
	const id = session.user.login || session.user.email;
	if (!id) return null;
	return {
		current: `dashboard-state:v2:${id}`,
		migration: `dashboard-state:migrated:${id}`,
		legacy: `dashboard-state:${id}`
	};
}

function parseStoredState(value: string): StoredState {
	const stored = JSON.parse(value) as StoredState;
	if (!stored || typeof stored.state !== 'object' || stored.state === null || typeof stored.updatedAt !== 'number') {
		throw new Error('Invalid stored dashboard state');
	}
	return stored;
}

async function readStoredState(
	kv: NonNullable<ReturnType<typeof getKV>>,
	keys: UserKeys,
	config: StateEncryptionConfig
): Promise<StoredSource | null> {
	// Normal writes always use current. A separately keyed migration copy is
	// authoritative only until the first normal write. The legacy key is last.
	for (const key of [keys.current, keys.migration, keys.legacy]) {
		const raw = await kv.get(key);
		if (!raw) continue;
		const decrypted = await decryptState(raw, config, key);
		return { key, stored: parseStoredState(decrypted.plaintext), decrypted };
	}
	return null;
}

async function migrateLegacyState(
	kv: NonNullable<ReturnType<typeof getKV>>,
	keys: UserKeys,
	stored: StoredState,
	config: StateEncryptionConfig
): Promise<void> {
	try {
		// The migration has its own destination. A concurrent PUT writes current,
		// which always wins on reads, so this GET can never overwrite newer state.
		await kv.put(keys.migration, await encryptState(JSON.stringify(stored), config, keys.migration));
		await kv.delete(keys.legacy);
	} catch {
		// A failed migration leaves the readable legacy record in place for retry.
	}
}

async function deleteIfPresent(
	kv: NonNullable<ReturnType<typeof getKV>>,
	key: string
): Promise<void> {
	try {
		await kv.delete(key);
	} catch {
		// The canonical current key remains authoritative; cleanup can retry later.
	}
}

export const GET: RequestHandler = async ({ locals, platform }) => {
	const keys = await getUserKeys(locals);
	if (!keys) return json({ error: 'Authentication required' }, { status: 401 });

	const kv = getKV(platform);
	if (!kv) return json({ error: 'Sync not configured' }, { status: 501 });
	const config = encryptionConfig();
	if (!config) return json({ error: 'Sync encryption not configured' }, { status: 503 });

	try {
		const source = await readStoredState(kv, keys, config);
		if (!source) return json({ state: null, updatedAt: 0 });
		if (source.key === keys.legacy) {
			await migrateLegacyState(kv, keys, source.stored, config);
		} else if (source.key === keys.migration) {
			await deleteIfPresent(kv, keys.legacy);
		}
		return json(source.stored);
	} catch {
		return json({ error: 'Synced state could not be decrypted' }, { status: 503 });
	}
};

export const PUT: RequestHandler = async ({ locals, platform, request }) => {
	const keys = await getUserKeys(locals);
	if (!keys) return json({ error: 'Authentication required' }, { status: 401 });

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

	let existing: StoredSource | null;
	try {
		existing = await readStoredState(kv, keys, config);
	} catch {
		return json(
			{ error: 'Existing synced state could not be decrypted; refusing to overwrite it' },
			{ status: 409 }
		);
	}

	if (existing) {
		if (existing.stored.updatedAt > body.updatedAt) {
			return json({ ok: false, conflict: true, updatedAt: existing.stored.updatedAt });
		}
		// Only a current record encrypted by the active key can skip the write.
		// Legacy/migration records and old key versions are promoted on this PUT.
		if (
			existing.key === keys.current &&
			!existing.decrypted.needsMigration &&
			JSON.stringify(existing.stored.state) === serializedState
		) {
			return json({ ok: true, unchanged: true, updatedAt: existing.stored.updatedAt });
		}
	}

	const stored = JSON.stringify({ state: body.state, updatedAt: body.updatedAt });
	await kv.put(keys.current, await encryptState(stored, config, keys.current));
	await deleteIfPresent(kv, keys.migration);
	await deleteIfPresent(kv, keys.legacy);
	return json({ ok: true, updatedAt: body.updatedAt });
};
