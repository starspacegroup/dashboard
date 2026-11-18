import { afterEach, describe, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({ dev: false }));
vi.mock('$app/environment', () => ({
	get dev() {
		return env.dev;
	}
}));

const dns = vi.hoisted(() => ({ resolveHost: vi.fn(async (_h: string): Promise<string[]> => ['93.184.216.34']) }));
vi.mock('$lib/server/resolveHost', () => dns);

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

	it('refuses loopback hosts', async () => {
		vi.stubGlobal('fetch', vi.fn());
		for (const url of ['http://localhost:4200', 'http://app.localhost', 'http://127.0.0.1', 'http://127.8.8.8', 'http://[::1]', 'http://2130706433', 'http://0x7f.1', 'http://0.0.0.0']) {
			expect((await POST(event(true, 'verify', { url, token: 'tok' }))).status, url).toBe(400);
		}
		expect(fetch).not.toHaveBeenCalled();
	});

	it('refuses private network hosts', async () => {
		vi.stubGlobal('fetch', vi.fn());
		for (const url of ['http://10.0.0.5', 'http://172.16.0.1', 'http://172.31.255.255', 'http://192.168.1.1', 'http://100.64.0.1', 'http://[fd00::1]', 'http://[fc00::1]']) {
			expect((await POST(event(true, 'verify', { url, token: 'tok' }))).status, url).toBe(400);
		}
		expect(fetch).not.toHaveBeenCalled();
	});

	it('refuses link-local and cloud metadata hosts', async () => {
		vi.stubGlobal('fetch', vi.fn());
		for (const url of ['http://169.254.169.254/latest/meta-data', 'http://169.254.0.1', 'http://[fe80::1]', 'http://[fd00:ec2::254]', 'http://metadata.google.internal', 'http://metadata.internal']) {
			expect((await POST(event(true, 'verify', { url, token: 'tok' }))).status, url).toBe(400);
		}
		expect(fetch).not.toHaveBeenCalled();
	});

	it('refuses private addresses written as IPv4-mapped IPv6', async () => {
		vi.stubGlobal('fetch', vi.fn());
		for (const url of ['http://[::ffff:127.0.0.1]', 'http://[::ffff:169.254.169.254]', 'http://[::ffff:10.0.0.1]']) {
			expect((await POST(event(true, 'verify', { url, token: 'tok' }))).status, url).toBe(400);
		}
		expect(fetch).not.toHaveBeenCalled();
	});

	it('still allows public hosts, including ones next to private ranges', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ stats: {} }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
		for (const url of ['https://example.com', 'http://172.32.0.1', 'http://11.0.0.1', 'http://100.128.0.1']) {
			expect((await POST(event(true, 'verify', { url, token: 'tok' }))).status, url).toBe(200);
		}
	});

	it('allows localhost in dev, but not private or metadata addresses', async () => {
		env.dev = true;
		try {
			const fetchMock = vi.fn(async () => new Response(JSON.stringify({ stats: {} }), { status: 200 }));
			vi.stubGlobal('fetch', fetchMock);
			expect((await POST(event(true, 'verify', { url: 'http://localhost:5173', token: 'tok' }))).status).toBe(200);
			expect((await POST(event(true, 'verify', { url: 'http://127.0.0.1:5173', token: 'tok' }))).status).toBe(200);
			expect((await POST(event(true, 'verify', { url: 'http://169.254.169.254', token: 'tok' }))).status).toBe(400);
			expect((await POST(event(true, 'verify', { url: 'http://10.0.0.5', token: 'tok' }))).status).toBe(400);
			expect(fetchMock).toHaveBeenCalledTimes(2);
		} finally {
			env.dev = false;
		}
	});

	it('refuses a public name that resolves to a loopback, private, link-local or metadata address', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		for (const address of ['127.0.0.1', '10.1.2.3', '192.168.0.9', '169.254.169.254', '::1', 'fd00:ec2::254', '::ffff:7f00:1']) {
			dns.resolveHost.mockResolvedValueOnce([address]);
			const res = await POST(event(true, 'verify', { url: 'https://evil.test', token: 'tok' }));
			expect(res.status, address).toBe(400);
			expect((await res.json()).error).toMatch(/private or internal/);
		}
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('refuses when any one of several resolved addresses is private', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		dns.resolveHost.mockResolvedValueOnce(['93.184.216.34', '10.0.0.1']);

		const res = await POST(event(true, 'verify', { url: 'https://mixed.test', token: 'tok' }));

		expect(res.status).toBe(400);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('refuses when the name does not resolve or the lookup fails', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		dns.resolveHost.mockResolvedValueOnce([]);
		expect((await POST(event(true, 'verify', { url: 'https://none.test', token: 'tok' }))).status).toBe(400);
		dns.resolveHost.mockRejectedValueOnce(new Error('dns down'));
		expect((await POST(event(true, 'verify', { url: 'https://down.test', token: 'tok' }))).status).toBe(400);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('allows a name whose addresses are all public', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ stats: {} }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
		dns.resolveHost.mockResolvedValueOnce(['93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946']);

		const res = await POST(event(true, 'verify', { url: 'https://good.test', token: 'tok' }));

		expect(res.status).toBe(200);
		expect(dns.resolveHost).toHaveBeenLastCalledWith('good.test');
	});

	it('does not look up IP literals, and in dev does not look up localhost', async () => {
		dns.resolveHost.mockClear();
		vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ stats: {} }), { status: 200 })));
		await POST(event(true, 'verify', { url: 'http://11.0.0.1', token: 'tok' }));
		env.dev = true;
		try {
			await POST(event(true, 'verify', { url: 'http://localhost:5173', token: 'tok' }));
		} finally {
			env.dev = false;
		}
		expect(dns.resolveHost).not.toHaveBeenCalled();
	});

	it('does not follow a redirect to another address', async () => {
		const fetchMock = vi.fn(async () => new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/' } }));
		vi.stubGlobal('fetch', fetchMock);

		const res = await POST(event(true, 'verify'));

		expect(res.status).toBe(502);
		expect((await res.json()).error).toMatch(/redirected/);
		expect(fetchMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ redirect: 'manual' }));
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
