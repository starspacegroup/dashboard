import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv = vi.hoisted(() => ({}) as Record<string, string>);
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

import { GET } from './+server';

function event(signedIn = true) {
	return {
		locals: { auth: vi.fn(async () => (signedIn ? { user: { login: 'alice' } } : null)) }
	} as never;
}

beforeEach(() => {
	delete mockEnv.GOOGLE_MAPS_API_KEY;
});

describe('/api/maps-config', () => {
	it('answers 401 without a session', async () => {
		mockEnv.GOOGLE_MAPS_API_KEY = 'key';
		const res = await GET(event(false));
		expect(res.status).toBe(401);
	});

	it('answers 500 when no key is configured', async () => {
		mockEnv.GOOGLE_MAPS_API_KEY = '   ';
		const res = await GET(event());
		expect(res.status).toBe(500);
	});

	it('returns the trimmed key, read at request time', async () => {
		mockEnv.GOOGLE_MAPS_API_KEY = '  abc123 ';
		const res = await GET(event());
		expect(await res.json()).toEqual({ apiKey: 'abc123' });
	});
});
