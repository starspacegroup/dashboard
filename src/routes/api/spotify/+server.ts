import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing';
const PLAYLISTS_URL = 'https://api.spotify.com/v1/me/playlists?limit=5';
const TIMEOUT_MS = 12_000;

function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
}

interface Playlist {
  name: string;
  image: string | null;
  url: string | null;
}

/**
 * The account's most recent playlists (Spotify lists them in the order the user
 * sees in the app). Best-effort: a refresh token granted without the
 * playlist-read-private scope, or any upstream failure, gives an empty list and
 * never fails the now-playing answer.
 */
async function fetchPlaylists(headers: Record<string, string>): Promise<Playlist[]> {
  try {
    const res = await fetchWithTimeout(PLAYLISTS_URL, { headers });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      items?: ({
        name?: string;
        images?: { url: string }[] | null;
        external_urls?: { spotify?: string };
      } | null)[];
    };
    return (data.items ?? [])
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => ({
        name: p.name ?? '',
        image: p.images?.[0]?.url ?? null,
        url: p.external_urls?.spotify ?? null
      }));
  } catch {
    return [];
  }
}

/**
 * Now-playing for the one Spotify account the operator configured.
 * Env is read per request (like /api/maps-config), so credentials added after
 * deploy take effect without a rebuild. Without all three values the answer is
 * `{ configured: false }` and nothing is sent upstream.
 */
export const GET: RequestHandler = async ({ locals }) => {
  const session = await locals.auth();
  if (!session?.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  const clientId = (env.SPOTIFY_CLIENT_ID ?? '').trim();
  const clientSecret = (env.SPOTIFY_CLIENT_SECRET ?? '').trim();
  const refreshToken = (env.SPOTIFY_REFRESH_TOKEN ?? '').trim();
  if (!clientId || !clientSecret || !refreshToken) {
    return json({ configured: false });
  }

  try {
    const tokenRes = await fetchWithTimeout(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(clientId + ':' + clientSecret),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
    });
    if (!tokenRes.ok) {
      return json({ configured: true, error: 'Spotify rejected the credentials' }, { status: 502 });
    }
    const tokenBody = (await tokenRes.json()) as { access_token?: string };
    if (!tokenBody.access_token) {
      return json({ configured: true, error: 'Spotify sent no access token' }, { status: 502 });
    }

    const headers = { Authorization: 'Bearer ' + tokenBody.access_token };
    const res = await fetchWithTimeout(NOW_PLAYING_URL, { headers });
    // 204: nothing is playing. A non-track item (ad, podcast) is treated the same.
    if (res.status === 204) {
      return json({ configured: true, playing: false, playlists: await fetchPlaylists(headers) });
    }
    if (!res.ok) {
      return json({ configured: true, error: 'Spotify is unavailable' }, { status: 502 });
    }
    const data = (await res.json()) as {
      is_playing?: boolean;
      item?: {
        type?: string;
        name?: string;
        artists?: { name: string }[];
        album?: { name?: string; images?: { url: string }[] };
        external_urls?: { spotify?: string };
      } | null;
    };
    const item = data.item;
    const playlists = await fetchPlaylists(headers);
    if (!item || item.type !== 'track') {
      return json({ configured: true, playing: false, playlists });
    }
    return json({
      configured: true,
      playing: !!data.is_playing,
      playlists,
      track: {
        name: item.name ?? '',
        artists: (item.artists ?? []).map((a) => a.name).join(', '),
        album: item.album?.name ?? '',
        image: item.album?.images?.[0]?.url ?? null,
        url: item.external_urls?.spotify ?? null
      }
    });
  } catch {
    return json({ configured: true, error: 'Spotify is unreachable' }, { status: 502 });
  }
};
