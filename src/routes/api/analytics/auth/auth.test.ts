import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv = vi.hoisted(() => ({}) as Record<string, string>);
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

import { GET } from './+server';

const cookieSet = vi.fn();

function event(
	{ signedIn = true, origin = 'https://dash.example' }: { signedIn?: boolean; origin?: string } = {}
) {
	return {
		url: new URL(`${origin}/api/analytics/auth`),
		locals: { auth: vi.fn(async () => (signedIn ? { user: { login: 'alice' } } : null)) },
		cookies: { set: cookieSet }
	} as never;
}

async function redirectOf(e: never) {
	try {
		await GET(e);
	} catch (r) {
		return r as { status: number; location: string };
	}
	throw new Error('expected a redirect');
}

beforeEach(() => {
	mockEnv.GA_OAUTH_CLIENT_ID = 'client-id';
	cookieSet.mockReset();
});

describe('/api/analytics/auth', () => {
	it('answers 401 to a signed-out caller and sets no cookie', async () => {
		const res = await GET(event({ signedIn: false }));
		expect(res.status).toBe(401);
		expect(cookieSet).not.toHaveBeenCalled();
	});

	it('answers 500 when the OAuth client id is not configured', async () => {
		mockEnv.GA_OAUTH_CLIENT_ID = '';
		const res = await GET(event());
		expect(res.status).toBe(500);
		expect(cookieSet).not.toHaveBeenCalled();
	});

	it('redirects to Google with the same state it stored in the cookie', async () => {
		const r = await redirectOf(event());
		expect(r.status).toBe(302);
		const target = new URL(r.location);
		expect(target.origin + target.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
		expect(target.searchParams.get('client_id')).toBe('client-id');
		expect(target.searchParams.get('redirect_uri')).toBe('https://dash.example/api/analytics/callback');
		expect(target.searchParams.get('access_type')).toBe('offline');
		const state = target.searchParams.get('state');
		expect(state).toBeTruthy();
		expect(cookieSet).toHaveBeenCalledWith(
			'ga_oauth_state',
			state,
			expect.objectContaining({ httpOnly: true, sameSite: 'lax', maxAge: 600 })
		);
	});

	it('marks the state cookie secure only over https', async () => {
		await redirectOf(event());
		expect(cookieSet.mock.calls[0][2].secure).toBe(true);
		cookieSet.mockReset();
		await redirectOf(event({ origin: 'http://localhost:4200' }));
		expect(cookieSet.mock.calls[0][2].secure).toBe(false);
	});
});
