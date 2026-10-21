import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));

import { POST } from './+server';

function event(query: string) {
	return {
		locals: { auth: vi.fn(async () => ({ user: { login: 'alice' } })) },
		url: new URL(`https://dashboard.test/api/cloudflare?${query}`),
		request: new Request('https://dashboard.test/api/cloudflare', {
			method: 'POST',
			body: JSON.stringify({ apiToken: 'test-token-1234567890' })
		})
	} as never;
}

describe('/api/cloudflare', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('gives Cloudflare calls a timeout signal', async () => {
		const fetchMock = vi.fn(
			async () => new Response(JSON.stringify({ success: true, result: { id: 'x', status: 'active' } }), { status: 200 })
		);
		vi.stubGlobal('fetch', fetchMock);

		await POST(event('action=verify'));

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining('/user/tokens/verify'),
			expect.objectContaining({ signal: expect.any(AbortSignal) })
		);
	});

	it('answers 500 instead of hanging when Cloudflare times out', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new DOMException('timed out', 'TimeoutError'))));

		const res = await POST(event('action=verify'));

		expect(res.status).toBe(500);
	});
});
