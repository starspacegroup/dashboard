import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));

import { GET } from './+server';

function event(query: string) {
	return {
		locals: { auth: vi.fn(async () => ({ user: { login: 'alice' } })) },
		url: new URL(`https://dashboard.test/api/crypto?${query}`)
	} as never;
}

describe('/api/crypto', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('gives CoinGecko calls a timeout signal', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ coins: [] }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		await GET(event('action=search&q=timeout-check'));

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining('/search?query=timeout-check'),
			expect.objectContaining({ signal: expect.any(AbortSignal) })
		);
	});

	it('answers 500 instead of hanging when CoinGecko times out', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new DOMException('timed out', 'TimeoutError'))));

		const res = await GET(event('action=price&coinId=bitcoin&skipCache=1'));

		expect(res.status).toBe(500);
	});

	it('answers 400 for a blank search query instead of searching for spaces', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		const res = await GET(event('action=search&q=%20%20'));

		expect(res.status).toBe(400);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('cuts an overlong search query to 100 characters before it goes upstream', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ coins: [] }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		await GET(event(`action=search&q=${'x'.repeat(5000)}`));

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining(`/search?query=${'x'.repeat(100)}`),
			expect.anything()
		);
		const sent = (fetchMock.mock.calls[0] as unknown as [string])[0];
		expect(sent.endsWith('x'.repeat(100))).toBe(true);
	});

	it('cuts an overlong coin id and trims a padded one', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({}), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		await GET(event(`action=price&skipCache=1&coinId=%20${'y'.repeat(900)}`));

		const sent = (fetchMock.mock.calls[0] as unknown as [string])[0];
		expect(sent).toContain(`ids=${'y'.repeat(100)}&`);
	});

	it('answers 404, and caches nothing, when CoinGecko knows no such coin', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({}), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		const res = await GET(event('action=price&coinId=nosuchcoin'));
		expect(res.status).toBe(404);

		await GET(event('action=price&coinId=nosuchcoin'));
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('reads the price when the caller sends the currency in capitals', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () =>
				new Response(JSON.stringify({ bitcoin: { eur: 90000, eur_24h_change: 1.5 } }), { status: 200 })
			)
		);

		const res = await GET(event('action=price&coinId=Bitcoin&vs=EUR&skipCache=1'));

		expect(await res.json()).toEqual({ price: 90000, change24h: 1.5 });
	});

	it('keeps serving fresh results after more distinct searches than the cache holds', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ coins: [] }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		for (let i = 0; i < 520; i++) await GET(event(`action=search&q=coin${i}`));
		fetchMock.mockClear();

		// The oldest entry was evicted, so this refetches; the newest is still cached.
		await GET(event('action=search&q=coin0'));
		expect(fetchMock).toHaveBeenCalledTimes(1);
		await GET(event('action=search&q=coin519'));
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});
