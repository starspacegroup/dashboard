import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { AUTH_SECRET: 'test-auth-secret' } }));

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
		expect(kv.values.get('dashboard-state:alice')).not.toContain('cf-secret');
		expect(await sameUserResponse.json()).toEqual({ state, updatedAt: 42 });
		expect(await otherUserResponse.json()).toEqual({ state: null, updatedAt: 0 });
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
