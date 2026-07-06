import { SvelteKitAuth } from '@auth/sveltekit';
import GitHub from '@auth/sveltekit/providers/github';
import { env } from '$env/dynamic/private';

const { GITHUB_ID = '', GITHUB_SECRET = '', AUTH_SECRET = '' } = env;

// Trim any whitespace from environment variables
const githubId = GITHUB_ID.trim();
const githubSecret = GITHUB_SECRET.trim();
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
	error?: string;
}

interface RefreshedTokens {
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
}

// GitHub refresh tokens are single-use. When several requests land at once
// (page load + API calls), each would try to refresh with the same token and
// all but one would fail, poisoning the session. Dedupe concurrent refreshes
// so requests in the same isolate share one refresh call.
const inflightRefreshes = new Map<string, Promise<RefreshedTokens | null>>();

function refreshAccessTokenDeduped(refreshToken: string): Promise<RefreshedTokens | null> {
	const existing = inflightRefreshes.get(refreshToken);
	if (existing) return existing;

	const promise = refreshAccessToken(refreshToken).finally(() => {
		// Keep the resolved promise around briefly so slightly-later requests
		// still reuse the result instead of retrying the consumed token
		setTimeout(() => inflightRefreshes.delete(refreshToken), 30_000);
	});
	inflightRefreshes.set(refreshToken, promise);
	return promise;
}

async function refreshAccessToken(refreshToken: string): Promise<RefreshedTokens | null> {
	try {
		const response = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: JSON.stringify({
				client_id: githubId,
				client_secret: githubSecret,
				grant_type: 'refresh_token',
				refresh_token: refreshToken
			})
		});

		const data = await response.json();
		if (data.error) {
			console.error('[AUTH] Token refresh error:', data.error, data.error_description);
			return null;
		}

		return {
			accessToken: data.access_token,
			refreshToken: data.refresh_token ?? refreshToken,
			expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in ?? 28800)
		};
	} catch (error) {
		console.error('[AUTH] Token refresh failed:', error);
		return null;
	}
}

export const { handle } = SvelteKitAuth({
	providers: [
		GitHub({
			clientId: githubId,
			clientSecret: githubSecret,
			authorization: {
				params: {
					scope: 'read:user user:email read:org repo read:project manage_billing:copilot'
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
				if (token.error) {
					(session as ExtendedSession).error = token.error as string;
				}
			}
			return session;
		},
		async jwt({ token, profile, account }) {
			if (profile) {
				token.login = (profile as ExtendedProfile).login;
			}
			if (account) {
				token.accessToken = account.access_token;
				token.refreshToken = account.refresh_token;
				token.expiresAt = account.expires_at;
			}

			// If token has an expiration, check if it needs refresh
			if (token.expiresAt && typeof token.expiresAt === 'number') {
				const now = Math.floor(Date.now() / 1000);
				const expiresAt = token.expiresAt as number;
				// Refresh 5 minutes before expiry to avoid edge cases
				if (now >= expiresAt - 300) {
					if (token.refreshToken && typeof token.refreshToken === 'string') {
						const refreshed = await refreshAccessTokenDeduped(token.refreshToken);
						if (refreshed) {
							token.accessToken = refreshed.accessToken;
							token.refreshToken = refreshed.refreshToken;
							token.expiresAt = refreshed.expiresAt;
							delete token.error;
						} else if (now >= expiresAt) {
							// Only give up once the access token is actually dead;
							// before that, keep using it and retry the refresh on a
							// later request (a lost refresh race is often transient)
							token.error = 'RefreshTokenError';
						}
					} else {
						token.error = 'TokenExpiredError';
					}
				}
			}

			return token;
		}
	}
});
