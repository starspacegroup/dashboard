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
});
