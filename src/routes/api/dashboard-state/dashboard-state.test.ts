import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
	env: {
		AUTH_SECRET: 'test-auth-secret',
		DASHBOARD_STATE_ENCRYPTION_KEY_VERSION: '2026-08',
		DASHBOARD_STATE_ENCRYPTION_KEYS: JSON.stringify({
			'2026-08': 'test-dashboard-encryption-secret-0001'
		})
	}
}));

import { GET, PUT } from './+server';

function createKV() {
	const values = new Map<string, string>();
	return {
		values,
		get: vi.fn(async (key: string) => values.get(key) ?? null),
		put: vi.fn(async (key: string, value: string) => { values.set(key, value); }),
		delete: vi.fn(async (key: string) => { values.delete(key); })
	};
}

function event(kv: ReturnType<typeof createKV>, login?: string, request?: Request) {
	return {
		locals: { auth: vi.fn(async () => login ? { user: { login } } : null) },
		platform: { env: { DASHBOARD_KV: kv } },
		request: request ?? new Request('https://dashboard.test/api/dashboard-state')
	} as never;
}

describe('/api/dashboard-state', () => {
	beforeEach(() => vi.clearAllMocks());
	const currentAlice = 'dashboard-state:v2:alice';
	const migrationAlice = 'dashboard-state:migrated:alice';
	const legacyAlice = 'dashboard-state:alice';

	it('rejects unauthenticated reads and writes', async () => {
		const kv = createKV();
		const getResponse = await GET(event(kv));
		const putResponse = await PUT(event(kv, undefined, new Request('https://dashboard.test/api/dashboard-state', {
			method: 'PUT', body: JSON.stringify({ state: {}, updatedAt: 1 })
		})));

		expect(getResponse.status).toBe(401);
		expect(putResponse.status).toBe(401);
		expect(kv.put).not.toHaveBeenCalled();
	});

	it('syncs encrypted credentials across devices for only the same user', async () => {
		const kv = createKV();
		const state = { 'dashboard-cloudflare-credentials': '{"credentials":[{"token":"cf-secret"}]}' };
		const putResponse = await PUT(event(kv, 'alice', new Request('https://dashboard.test/api/dashboard-state', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ state, updatedAt: 42 })
		})));
		const sameUserResponse = await GET(event(kv, 'alice'));
		const otherUserResponse = await GET(event(kv, 'bob'));

		expect(putResponse.status).toBe(200);
		expect(kv.values.get(currentAlice)).toMatch(/^enc:v2:2026-08:/);
		expect(kv.values.get(currentAlice)).not.toContain('cf-secret');
		expect(await sameUserResponse.json()).toEqual({ state, updatedAt: 42 });
		expect(await otherUserResponse.json()).toEqual({ state: null, updatedAt: 0 });
	});

	it('moves a valid plaintext legacy snapshot to a separate encrypted migration key', async () => {
		const kv = createKV();
		const legacy = JSON.stringify({ state: { legacy: 'credential' }, updatedAt: 7 });
		kv.values.set(legacyAlice, legacy);

		const response = await GET(event(kv, 'alice'));

		expect(await response.json()).toEqual({ state: { legacy: 'credential' }, updatedAt: 7 });
		expect(kv.get).toHaveBeenCalledTimes(3);
		expect(kv.put).toHaveBeenCalledTimes(1);
		expect(kv.values.has(legacyAlice)).toBe(false);
		expect(kv.values.get(migrationAlice)).toMatch(/^enc:v2:2026-08:/);
		expect(kv.values.get(migrationAlice)).not.toContain('credential');
	});

	it('cannot overwrite a concurrent PUT while migrating a legacy snapshot', async () => {
		const kv = createKV();
		const original = JSON.stringify({ state: { value: 'original' }, updatedAt: 1 });
		kv.values.set(legacyAlice, original);
		kv.put.mockImplementationOnce(async (key: string, value: string) => {
			const concurrent = await PUT(event(kv, 'alice', new Request('https://dashboard.test/api/dashboard-state', {
				method: 'PUT', body: JSON.stringify({ state: { value: 'newer' }, updatedAt: 2 })
			})));
			expect(concurrent.status).toBe(200);
			kv.values.set(key, value);
		});

		const response = await GET(event(kv, 'alice'));
		const nextResponse = await GET(event(kv, 'alice'));

		expect(await response.json()).toEqual({ state: { value: 'original' }, updatedAt: 1 });
		expect(await nextResponse.json()).toEqual({ state: { value: 'newer' }, updatedAt: 2 });
		expect(kv.values.get(currentAlice)).toMatch(/^enc:v2:2026-08:/);
		expect(kv.values.get(migrationAlice)).toMatch(/^enc:v2:2026-08:/);
	});

	it('still returns valid legacy state when its migration write fails', async () => {
		const kv = createKV();
		const legacy = JSON.stringify({ state: { value: 'available' }, updatedAt: 1 });
		kv.values.set(legacyAlice, legacy);
		kv.put.mockRejectedValueOnce(new Error('KV write failed'));

		const response = await GET(event(kv, 'alice'));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ state: { value: 'available' }, updatedAt: 1 });
		expect(kv.values.get(legacyAlice)).toBe(legacy);
	});

	it('rejects a ciphertext copied under another user key', async () => {
		const kv = createKV();
		await PUT(event(kv, 'alice', new Request('https://dashboard.test/api/dashboard-state', {
			method: 'PUT', body: JSON.stringify({ state: { token: 'alice-secret' }, updatedAt: 1 })
		})));
		kv.values.set('dashboard-state:v2:bob', kv.values.get(currentAlice)!);

		const response = await GET(event(kv, 'bob'));

		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ error: 'Synced state could not be decrypted' });
	});

	it('refuses to overwrite an existing snapshot that cannot be decrypted', async () => {
		const kv = createKV();
		kv.values.set(currentAlice, 'enc:v2:missing-key:AA==:AA==');

		const response = await PUT(event(kv, 'alice', new Request('https://dashboard.test/api/dashboard-state', {
			method: 'PUT', body: JSON.stringify({ state: { replacement: true }, updatedAt: 2 })
		})));

		expect(response.status).toBe(409);
		expect(kv.put).not.toHaveBeenCalled();
		expect(kv.values.get(currentAlice)).toBe('enc:v2:missing-key:AA==:AA==');
	});

	it('does not overwrite newer state', async () => {
		const kv = createKV();
		await PUT(event(kv, 'alice', new Request('https://dashboard.test/api/dashboard-state', {
			method: 'PUT', body: JSON.stringify({ state: { value: 'new' }, updatedAt: 10 })
		})));
		const response = await PUT(event(kv, 'alice', new Request('https://dashboard.test/api/dashboard-state', {
			method: 'PUT', body: JSON.stringify({ state: { value: 'old' }, updatedAt: 9 })
		})));

		expect(await response.json()).toEqual({ ok: false, conflict: true, updatedAt: 10 });
		expect(kv.put).toHaveBeenCalledTimes(1);
	});
});
