import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveHost } from './resolveHost';

function answer(records: { type: number; data: string }[]) {
	return new Response(JSON.stringify({ Answer: records }), { status: 200 });
}

describe('resolveHost', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('asks for A and AAAA records and returns both sets', async () => {
		const fetchMock = vi.fn(async (url: string) =>
			url.includes('type=AAAA')
				? answer([{ type: 28, data: '2606:2800:220:1::1' }])
				: answer([{ type: 1, data: '93.184.216.34' }])
		);
		vi.stubGlobal('fetch', fetchMock);

		const addresses = await resolveHost('example.com');

		expect(addresses).toEqual(['93.184.216.34', '2606:2800:220:1::1']);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining('name=example.com&type=A'),
			expect.objectContaining({ signal: expect.any(AbortSignal) })
		);
	});

	it('drops CNAME records that ride along in the answer', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async (url: string) =>
				url.includes('type=AAAA')
					? answer([])
					: answer([
							{ type: 5, data: 'real.example.net.' },
							{ type: 1, data: '203.0.113.7' }
						])
			)
		);

		expect(await resolveHost('alias.example.com')).toEqual(['203.0.113.7']);
	});

	it('returns an empty list when the name has no records', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));

		expect(await resolveHost('nothing.example.com')).toEqual([]);
	});

	it('encodes the hostname in the query', async () => {
		const fetchMock = vi.fn(async () => answer([]));
		vi.stubGlobal('fetch', fetchMock);

		await resolveHost('a&b=c.example.com');

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining('name=a%26b%3Dc.example.com'),
			expect.anything()
		);
	});

	it('throws when the resolver answers with an HTTP error', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));

		await expect(resolveHost('example.com')).rejects.toThrow('DNS answered HTTP 503');
	});

	it('throws when the resolver call fails', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('network down'))));

		await expect(resolveHost('example.com')).rejects.toThrow('network down');
	});
});
