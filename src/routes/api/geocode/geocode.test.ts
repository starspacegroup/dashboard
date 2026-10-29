import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET } from './+server';

function event(query: string, signedIn = true) {
	return {
		locals: { auth: vi.fn(async () => (signedIn ? { user: { login: 'alice' } } : null)) },
		url: new URL(`https://dashboard.test/api/geocode?q=${encodeURIComponent(query)}`)
	} as never;
}

afterEach(() => vi.unstubAllGlobals());

describe('/api/geocode', () => {
	it('answers 401 without a session', async () => {
		const res = await GET(event('Portland', false));
		expect(res.status).toBe(401);
	});

	it('answers empty for a one-letter query without calling upstream', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		const res = await GET(event(' a '));
		expect(await res.json()).toEqual({ results: [] });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('trims a very long query before sending it upstream', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ results: [] })));
		vi.stubGlobal('fetch', fetchMock);
		await GET(event('x'.repeat(5000)));
		const sent = new URL((fetchMock.mock.calls[0] as unknown as [string])[0]);
		expect(sent.searchParams.get('name')).toHaveLength(100);
	});
});
