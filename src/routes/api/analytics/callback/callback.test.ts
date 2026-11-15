import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv = vi.hoisted(() => ({}) as Record<string, string>);
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

import { GET } from './+server';

const fetchMock = vi.fn();
const cookieDelete = vi.fn();

function event(
	query: string,
	{ signedIn = true, stateCookie = 'good-state' }: { signedIn?: boolean; stateCookie?: string } = {}
) {
	return {
		url: new URL(`https://dash.example/api/analytics/callback?${query}`),
		locals: { auth: vi.fn(async () => (signedIn ? { user: { login: 'alice' } } : null)) },
		cookies: { get: vi.fn(() => stateCookie), delete: cookieDelete }
	} as never;
}

beforeEach(() => {
	mockEnv.GA_OAUTH_CLIENT_ID = 'id';
	mockEnv.GA_OAUTH_CLIENT_SECRET = 'secret';
	fetchMock.mockReset();
	cookieDelete.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('/api/analytics/callback', () => {
	it('hands the refresh token to the opener on success', async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ access_token: 'a', refresh_token: 'r-1', expires_in: 3600 }))
		);
		const res = await GET(event('code=c&state=good-state'));
		const html = await res.text();
		expect(html).toContain('"refreshToken":"r-1"');
		expect(res.headers.get('cache-control')).toBe('no-store');
		expect(cookieDelete).toHaveBeenCalledWith('ga_oauth_state', { path: '/' });
	});

	it('rejects a state that does not match the cookie, without calling Google', async () => {
		const res = await GET(event('code=c&state=other'));
		expect(await res.text()).toContain('CSRF check failed');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('rejects a signed-out caller, without calling Google', async () => {
		const res = await GET(event('code=c&state=good-state', { signedIn: false }));
		expect(await res.text()).toContain('Authentication required');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('reports a missing refresh token', async () => {
		fetchMock.mockResolvedValue(new Response(JSON.stringify({ access_token: 'a', expires_in: 1 })));
		const res = await GET(event('code=c&state=good-state'));
		expect(await res.text()).toContain('No refresh token received');
	});

	it('reports an unreachable Google in the popup instead of throwing', async () => {
		fetchMock.mockRejectedValue(new DOMException('timed out', 'TimeoutError'));
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const res = await GET(event('code=c&state=good-state'));
		expect(res.status).toBe(200);
		expect(await res.text()).toContain('Could not reach Google');
	});

	it('cannot be made to close the script block with a crafted error param', async () => {
		const res = await GET(event('error=%3C%2Fscript%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E'));
		const html = await res.text();
		expect(html.match(/<\/script>/g)).toHaveLength(1);
		expect(html).not.toContain('alert(1)');
	});
});
