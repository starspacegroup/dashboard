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

	it('shapes results: US state abbreviated, country upper-cased, display name built', async () => {
		const upstream = {
			results: [
				{ name: 'Portland', admin1: 'Maine', country_code: 'us', latitude: 43.66, longitude: -70.25, timezone: 'America/New_York' },
				{ name: 'Paris', admin1: 'Île-de-France', country_code: 'fr', latitude: 48.85, longitude: 2.35, timezone: 'Europe/Paris' },
				{ name: 'Nowhere', latitude: 1, longitude: 2, timezone: 'UTC' }
			]
		};
		vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(upstream))));
		const { results } = await (await GET(event('Portland'))).json();
		expect(results[0]).toEqual({
			name: 'Portland', state: 'ME', country: 'US', lat: 43.66, lon: -70.25,
			timezone: 'America/New_York', displayName: 'Portland, ME, US'
		});
		expect(results[1].displayName).toBe('Paris, Île-de-France, FR');
		expect(results[2].displayName).toBe('Nowhere');
	});

	it('answers an empty list when upstream has no results key', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({}))));
		const res = await GET(event('Zzzzzz'));
		expect(await res.json()).toEqual({ results: [] });
	});

	it('answers 500 with a plain reason when upstream errors or the call throws', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 503 })));
		const bad = await GET(event('Portland'));
		expect(bad.status).toBe(500);
		expect(await bad.json()).toEqual({ error: 'Failed to geocode location' });

		vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('timeout'); }));
		const thrown = await GET(event('Portland'));
		expect(thrown.status).toBe(500);
	});
});
