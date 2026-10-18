import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST } from './+server';

function event(signedIn: boolean, action = 'verify', body: unknown = { url: 'https://site.test', token: 'tok' }) {
	return {
		locals: { auth: vi.fn(async () => (signedIn ? { user: { login: 'alice' } } : null)) },
		url: new URL(`https://dashboard.test/api/nebulakit?action=${action}`),
		request: new Request('https://dashboard.test/api/nebulakit', { method: 'POST', body: JSON.stringify(body) })
	} as never;
}

describe('/api/nebulakit', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('refuses unauthenticated callers without fetching anything', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		const res = await POST(event(false));

		expect(res.status).toBe(401);
		expect((await res.json()).code).toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('forwards the token to the site for a signed-in user', async () => {
		const fetchMock = vi.fn(async () =>
			new Response(JSON.stringify({ site: { name: 'Site' }, stats: {} }), { status: 200 })
		);
		vi.stubGlobal('fetch', fetchMock);

		const res = await POST(event(true));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ valid: true, site: { name: 'Site' } });
		expect(fetchMock).toHaveBeenCalledWith(
			'https://site.test/api/stats/summary?window=1',
			expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer tok' }) })
		);
	});
});
