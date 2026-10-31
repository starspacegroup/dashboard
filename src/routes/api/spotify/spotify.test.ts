import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv = vi.hoisted(() => ({}) as Record<string, string>);
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

import { GET } from './+server';

function event(signedIn = true) {
	return {
		locals: { auth: vi.fn(async () => (signedIn ? { user: { login: 'alice' } } : null)) }
	} as never;
}

const fetchMock = vi.fn();

beforeEach(() => {
	mockEnv.SPOTIFY_CLIENT_ID = 'id';
	mockEnv.SPOTIFY_CLIENT_SECRET = 'secret';
	mockEnv.SPOTIFY_REFRESH_TOKEN = 'refresh';
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

const tokenOk = () => new Response(JSON.stringify({ access_token: 'at' }), { status: 200 });
const noContent = () => new Response(null, { status: 204 });

describe('/api/spotify', () => {
	it('answers 401 without a session', async () => {
		const res = await GET(event(false));
		expect(res.status).toBe(401);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it.each(['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN'])(
		'reports not configured when %s is blank, without calling Spotify',
		async (key) => {
			mockEnv[key] = '  ';
			const res = await GET(event());
			expect(await res.json()).toEqual({ configured: false });
			expect(fetchMock).not.toHaveBeenCalled();
		}
	);

	it('returns the current track', async () => {
		fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					is_playing: true,
					item: {
						type: 'track',
						name: 'Song',
						artists: [{ name: 'A' }, { name: 'B' }],
						album: { name: 'Album', images: [{ url: 'http://img/1' }] },
						external_urls: { spotify: 'http://open/1' }
					}
				}),
				{ status: 200 }
			)
		);
		const body = await (await GET(event())).json();
		expect(body).toEqual({
			configured: true,
			playing: true,
			track: {
				name: 'Song',
				artists: 'A, B',
				album: 'Album',
				image: 'http://img/1',
				url: 'http://open/1'
			}
		});
		expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Basic ' + btoa('id:secret'));
		expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer at');
	});

	it('reads env per request', async () => {
		mockEnv.SPOTIFY_CLIENT_ID = '';
		expect(await (await GET(event())).json()).toEqual({ configured: false });
		mockEnv.SPOTIFY_CLIENT_ID = 'id';
		fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(noContent());
		expect((await (await GET(event())).json()).configured).toBe(true);
	});

	it('reports nothing playing on 204', async () => {
		fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(noContent());
		expect(await (await GET(event())).json()).toEqual({ configured: true, playing: false });
	});

	it('treats a non-track item (podcast, ad) as nothing playing', async () => {
		fetchMock
			.mockResolvedValueOnce(tokenOk())
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ is_playing: true, item: { type: 'episode' } }), {
					status: 200
				})
			);
		expect(await (await GET(event())).json()).toEqual({ configured: true, playing: false });
	});

	it('answers 502 when Spotify rejects the credentials', async () => {
		fetchMock.mockResolvedValueOnce(new Response('{}', { status: 400 }));
		expect((await GET(event())).status).toBe(502);
	});

	it('answers 502 when Spotify errors on the player call', async () => {
		fetchMock
			.mockResolvedValueOnce(tokenOk())
			.mockResolvedValueOnce(new Response('{}', { status: 500 }));
		expect((await GET(event())).status).toBe(502);
	});

	it('answers 502 when the network fails', async () => {
		fetchMock.mockRejectedValueOnce(new Error('boom'));
		expect((await GET(event())).status).toBe(502);
	});
});
