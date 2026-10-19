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
