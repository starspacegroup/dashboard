import { SvelteKitAuth } from '@auth/sveltekit';
import GitHub from '@auth/core/providers/github';
import Spotify from '@auth/core/providers/spotify';
import { env } from '$env/dynamic/private';

const { GITHUB_ID = '', GITHUB_SECRET = '', SPOTIFY_CLIENT_ID = '', SPOTIFY_CLIENT_SECRET = '', AUTH_SECRET = '' } = env;

// Trim any whitespace from environment variables
const githubId = GITHUB_ID.trim();
const githubSecret = GITHUB_SECRET.trim();
const spotifyClientId = SPOTIFY_CLIENT_ID.trim();
const spotifyClientSecret = SPOTIFY_CLIENT_SECRET.trim();
const authSecret = AUTH_SECRET.trim();

interface ExtendedUser {
	name?: string | null;
	email?: string | null;
	image?: string | null;
	login?: string;
}

interface ExtendedProfile {
	login?: string;
}

interface ExtendedSession {
	user?: ExtendedUser;
	accessToken?: string;
	spotifyAccessToken?: string;
	spotifyRefreshToken?: string;
}

export const { handle } = SvelteKitAuth({
	providers: [
		GitHub({
			clientId: githubId,
			clientSecret: githubSecret,
			authorization: {
				params: {
					scope: 'read:user user:email read:org repo read:project'
				}
			}
		}),
		Spotify({
			clientId: spotifyClientId,
			clientSecret: spotifyClientSecret,
			authorization: {
				params: {
					scope: 'user-read-email user-read-private user-read-playback-state user-read-currently-playing user-read-recently-played playlist-read-private playlist-read-collaborative'
				}
			}
		})
	],
	secret: authSecret,
	trustHost: true,
	callbacks: {
		async session({ session, token }) {
			if (session.user && token) {
				// Add GitHub username and access token to session
				(session.user as ExtendedUser).login = token.login as string;
				(session as ExtendedSession).accessToken = token.accessToken as string;
				(session as ExtendedSession).spotifyAccessToken = token.spotifyAccessToken as string;
				(session as ExtendedSession).spotifyRefreshToken = token.spotifyRefreshToken as string;
			}
			return session;
		},
		async jwt({ token, profile, account }) {
			if (profile) {
				token.login = (profile as ExtendedProfile).login;
			}
			if (account) {
				// Store access tokens based on provider
				if (account.provider === 'github') {
					token.accessToken = account.access_token;
				} else if (account.provider === 'spotify') {
					token.spotifyAccessToken = account.access_token;
					token.spotifyRefreshToken = account.refresh_token;
				}
			}
			return token;
		}
	}
});
