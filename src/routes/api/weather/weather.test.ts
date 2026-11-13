import { describe, expect, it, vi } from 'vitest';

import { GET } from './+server';

function event(query: string) {
	return {
		locals: { auth: vi.fn(async () => ({ user: { login: 'alice' } })) },
		url: new URL(`https://dashboard.test/api/weather?${query}`)
	} as never;
}

describe('/api/weather', () => {
	it('rejects a latitude sent without a longitude', async () => {
		const res = await GET(event('lat=44.1'));
		expect(res.status).toBe(400);
	});

	it('rejects a longitude sent without a latitude', async () => {
		const res = await GET(event('lon=-70.2'));
		expect(res.status).toBe(400);
	});

	it('rejects out-of-range coordinates', async () => {
		const res = await GET(event('lat=91&lon=0'));
		expect(res.status).toBe(400);
	});

	it('cuts a long zip to 100 characters before it goes upstream', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ results: [] })));
		vi.stubGlobal('fetch', fetchMock);
		try {
			const res = await GET(event(`zip=${'9'.repeat(500)}`));
			expect(res.status).toBe(400);
			const first = new URL(String((fetchMock.mock.calls[0] as unknown[])[0]));
			expect(first.hostname).toBe('geocoding-api.open-meteo.com');
			expect(first.searchParams.get('name')).toBe(`${'9'.repeat(100)} USA`);
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
