import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv = vi.hoisted(() => ({}) as Record<string, string>);
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

function event(signedIn = true) {
	return {
		locals: { auth: vi.fn(async () => (signedIn ? { user: { login: 'alice' } } : null)) }
	} as never;
}

const fetchMock = vi.fn();
let GET: typeof import('./+server').GET;

const ok = (result: unknown) =>
	new Response(JSON.stringify({ success: true, result }), { status: 200 });

beforeEach(async () => {
	// The route keeps a module-level cache; load a fresh copy per test.
	vi.resetModules();
	({ GET } = await import('./+server'));
	mockEnv.CLOUDFLARE_RADAR_TOKEN = 'tok';
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

function answerAll() {
	fetchMock.mockImplementation(async (url: string) => {
		if (url.includes('/annotations/outages'))
			return ok({
				annotations: [
					{ description: 'Cable cut', locations: ['XX'], startDate: '2026-11-04T00:00:00Z', endDate: null }
				]
			});
		if (url.includes('ip_version')) return ok({ summary_0: { IPv4: '60.5', IPv6: '39.5' } });
		return ok({ summary_0: { 'HTTP/1.x': '20', 'HTTP/2': '50', 'HTTP/3': '30' } });
	});
}

describe('/api/radar', () => {
	it('answers 401 without a session', async () => {
		const res = await GET(event(false));
		expect(res.status).toBe(401);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('reports not configured when the token is blank, without calling Radar', async () => {
		mockEnv.CLOUDFLARE_RADAR_TOKEN = '  ';
		const res = await GET(event());
		expect(await res.json()).toEqual({ configured: false });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('returns the summary and sends the token as a Bearer credential', async () => {
		answerAll();
		const body = await (await GET(event())).json();
		expect(body).toEqual({
			configured: true,
			outages: [
				{ description: 'Cable cut', locations: ['XX'], startDate: '2026-11-04T00:00:00Z', ongoing: true }
			],
			ipv6Share: 39.5,
			http3Share: 30
		});
		const init = fetchMock.mock.calls[0][1] as RequestInit;
		expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
	});

	it('keeps the other panels when one endpoint fails', async () => {
		fetchMock.mockImplementation(async (url: string) =>
			url.includes('outages')
				? new Response('no', { status: 500 })
				: ok({ summary_0: { IPv6: '40', 'HTTP/3': '31' } })
		);
		const body = await (await GET(event())).json();
		expect(body.outages).toBeNull();
		expect(body.ipv6Share).toBe(40);
		expect(body.http3Share).toBe(31);
	});

	it('answers 502 when every endpoint fails', async () => {
		fetchMock.mockRejectedValue(new Error('down'));
		const res = await GET(event());
		expect(res.status).toBe(502);
		expect((await res.json()).error).toMatch(/unavailable/);
	});

	it('serves a repeat request from the cache', async () => {
		answerAll();
		await GET(event());
		const calls = fetchMock.mock.calls.length;
		await GET(event());
		expect(fetchMock.mock.calls.length).toBe(calls);
	});
});
