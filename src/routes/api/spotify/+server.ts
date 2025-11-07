import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface ExtendedSession {
	user?: {
		name?: string | null;
		email?: string | null;
		image?: string | null;
		login?: string;
	};
	accessToken?: string;
	spotifyAccessToken?: string;
	spotifyRefreshToken?: string;
}

export const GET: RequestHandler = async ({ locals }) => {
	const session = await locals.getSession() as ExtendedSession | null;

	if (!session?.spotifyAccessToken) {
		throw error(401, 'Not authenticated with Spotify');
	}

	const spotifyToken = session.spotifyAccessToken;

	try {
		// Fetch current playback state
		const playerResponse = await fetch('https://api.spotify.com/v1/me/player', {
			headers: {
				'Authorization': `Bearer ${spotifyToken}`
			}
		});

		let playerState = null;
		if (playerResponse.ok) {
			// Spotify returns 204 No Content when nothing is playing
			if (playerResponse.status !== 204) {
				const text = await playerResponse.text();
				if (text) {
					playerState = JSON.parse(text);
				}
			}
		}

		// Fetch user's playlists
		const playlistsResponse = await fetch('https://api.spotify.com/v1/me/playlists?limit=10', {
			headers: {
				'Authorization': `Bearer ${spotifyToken}`
			}
		});

		let playlists = [];
		if (playlistsResponse.ok) {
			const playlistsData = await playlistsResponse.json();
			playlists = playlistsData.items || [];
		}

		// Fetch recently played tracks
		const recentlyPlayedResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
			headers: {
				'Authorization': `Bearer ${spotifyToken}`
			}
		});

		let recentlyPlayed = [];
		if (recentlyPlayedResponse.ok) {
			const recentData = await recentlyPlayedResponse.json();
			recentlyPlayed = recentData.items || [];
		}

		return json({
			playerState,
			playlists,
			recentlyPlayed
		});
	} catch (err) {
		console.error('Spotify API error:', err);
		throw error(500, 'Failed to fetch Spotify data');
	}
};
