import { afterEach, describe, expect, it, vi } from 'vitest';

const mockEnv = vi.hoisted(
	() => ({ GA_OAUTH_CLIENT_ID: 'id', GA_OAUTH_CLIENT_SECRET: 'secret' }) as Record<string, string>
);
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

import { POST } from './+server';

function event(signedIn: boolean, query: string, body: unknown = { refreshToken: 'refresh-token-abcdef' }) {
	return {
		locals: { auth: vi.fn(async () => (signedIn ? { user: { login: 'alice' } } : null)) },
		url: new URL(`https://dashboard.test/api/analytics?${query}`),
		request: new Request('https://dashboard.test/api/analytics', { method: 'POST', body: JSON.stringify(body) })
	} as never;
}

describe('/api/analytics', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('refuses unauthenticated callers without fetching anything', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		const res = await POST(event(false, 'action=properties'));

		expect(res.status).toBe(401);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('answers 400 when no Google connection is sent', async () => {
		const res = await POST(event(true, 'action=properties', {}));
		expect(res.status).toBe(400);
	});

	it('serves the property list from cache even though each request gets a new access token', async () => {
		let minted = 0;
		const fetchMock = vi.fn(async (input: string, _init?: RequestInit) =>
			String(input).includes('oauth2')
				? new Response(JSON.stringify({ access_token: `at-${++minted}-xxxxxxxx` }), { status: 200 })
				: new Response(JSON.stringify({ accountSummaries: [] }), { status: 200 })
		);
		vi.stubGlobal('fetch', fetchMock);
		const body = { refreshToken: 'cache-test-refresh-token' };

		expect((await POST(event(true, 'action=properties', body))).status).toBe(200);
		expect((await POST(event(true, 'action=properties', body))).status).toBe(200);

		const adminCalls = fetchMock.mock.calls.filter(([u]) => String(u).includes('analyticsadmin'));
		expect(adminCalls).toHaveLength(1);
	});

	it('treats a non-numeric days value as the 7-day default', async () => {
		const fetchMock = vi.fn(async (input: string, _init?: RequestInit) =>
			String(input).includes('oauth2')
				? new Response(JSON.stringify({ access_token: 'at' }), { status: 200 })
				: new Response(JSON.stringify({ rows: [], totals: [], metricHeaders: [] }), { status: 200 })
		);
		vi.stubGlobal('fetch', fetchMock);

		const res = await POST(event(true, 'action=report&propertyId=123&days=abc&skipCache=1'));

		expect(res.status).toBe(200);
		expect((await res.json()).days).toBe(7);
		const report = fetchMock.mock.calls.find(([u]) => String(u).includes('runReport'));
		const sent = JSON.parse((report![1] as RequestInit).body as string);
		expect(sent.dateRanges[0].startDate).toBe('7daysAgo');
	});
});
