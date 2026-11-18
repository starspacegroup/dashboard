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

	it('rejects a bad body, a missing site URL, a non-http URL and a missing token with 400', async () => {
		vi.stubGlobal('fetch', vi.fn());

		const notJson = {
			locals: { auth: async () => ({ user: { login: 'alice' } }) },
			url: new URL('https://dashboard.test/api/nebulakit?action=verify'),
			request: new Request('https://dashboard.test/api/nebulakit', { method: 'POST', body: 'nope' })
		} as never;
		expect((await POST(notJson)).status).toBe(400);
		expect((await POST(event(true, 'verify', { token: 'tok' }))).status).toBe(400);
		expect((await POST(event(true, 'verify', { url: 'ftp://site.test', token: 'tok' }))).status).toBe(400);
		expect((await POST(event(true, 'verify', { url: 'https://site.test', token: '  ' }))).status).toBe(400);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('rejects an unknown action', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ stats: {} }), { status: 200 })));

		const res = await POST(event(true, 'nuke'));

		expect(res.status).toBe(400);
	});

	it('answers 401 reconnect_required when the site rejects the token', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(JSON.stringify({ message: 'Token revoked.' }), { status: 403 }))
		);

		const res = await POST(event(true, 'verify'));

		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({ error: 'Token revoked.', code: 'reconnect_required' });
	});

	it('answers 502 with a plain reason when the site is too old, not NebulaKit, or unreachable', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({}), { status: 404 })));
		let res = await POST(event(true, 'verify'));
		expect(res.status).toBe(502);
		expect((await res.json()).error).toMatch(/predates stats sharing/);

		vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>hi</html>', { status: 200 })));
		res = await POST(event(true, 'verify'));
		expect(res.status).toBe(502);
		expect((await res.json()).error).toMatch(/does not look like a NebulaKit site/);

		vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: 1 }), { status: 200 })));
		res = await POST(event(true, 'verify'));
		expect(res.status).toBe(502);
		expect((await res.json()).error).toMatch(/not with a stats summary/);

		vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('connect refused'); }));
		res = await POST(event(true, 'verify'));
		expect(res.status).toBe(502);
		expect((await res.json()).error).toBe('Could not reach https://site.test.');
	});

	it('answers 502 instead of hanging when the site times out', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('aborted', 'AbortError'); }));

		const res = await POST(event(true, 'verify'));

		expect(res.status).toBe(502);
		expect((await res.json()).error).toBe('The site did not answer in time.');
	});

	it('summary: clamps the window, caches per site and token, and skipCache bypasses it', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ stats: { views: 1 } }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
		const body = { url: 'https://cache.test/some/path', token: 'cache-token-1' };

		const first = await POST(event(true, 'summary', body));
		expect(await first.json()).toEqual({ stats: { views: 1 } });
		expect(fetchMock).toHaveBeenCalledWith('https://cache.test/api/stats/summary?window=7', expect.anything());

		await POST(event(true, 'summary', body));
		expect(fetchMock).toHaveBeenCalledTimes(1);

		// A different token for the same site must not share the cached answer.
		await POST(event(true, 'summary', { ...body, token: 'cache-token-2' }));
		expect(fetchMock).toHaveBeenCalledTimes(2);

		const skip = {
			locals: { auth: async () => ({ user: { login: 'alice' } }) },
			url: new URL('https://dashboard.test/api/nebulakit?action=summary&skipCache=1&days=30'),
			request: new Request('https://dashboard.test/api/nebulakit', { method: 'POST', body: JSON.stringify(body) })
		} as never;
		await POST(skip);
		expect(fetchMock).toHaveBeenLastCalledWith('https://cache.test/api/stats/summary?window=30', expect.anything());
	});

	it('summary: an unsupported days value falls back to 7', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ stats: {} }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
		const ev = {
			locals: { auth: async () => ({ user: { login: 'alice' } }) },
			url: new URL('https://dashboard.test/api/nebulakit?action=summary&days=365'),
			request: new Request('https://dashboard.test/api/nebulakit', {
				method: 'POST',
				body: JSON.stringify({ url: 'https://clamp.test', token: 'clamp-token' })
			})
		} as never;

		await POST(ev);

		expect(fetchMock).toHaveBeenCalledWith('https://clamp.test/api/stats/summary?window=7', expect.anything());
	});

	it('summary: keeps the cache at 200 entries, dropping the oldest write first', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ stats: {} }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
		const sites = Array.from({ length: 201 }, (_, i) => ({ url: `https://evict${i}.test`, token: 'evict-token' }));

		for (const s of sites) await POST(event(true, 'summary', s));
		expect(fetchMock).toHaveBeenCalledTimes(201);

		// The newest is still cached; the first was evicted and must refetch.
		await POST(event(true, 'summary', sites[200]));
		expect(fetchMock).toHaveBeenCalledTimes(201);
		await POST(event(true, 'summary', sites[0]));
		expect(fetchMock).toHaveBeenCalledTimes(202);
	});
});
